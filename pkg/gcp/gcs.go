package gcp

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"path"
	"strings"

	"cloud.google.com/go/storage"
	humanize "github.com/dustin/go-humanize"
	"github.com/golang/glog"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/googleapi"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

const v1 = "v1"

// GCS is a helper layer to wrap complex GCS logic.
type GCS struct {
	projectID string

	bucket string
	prefix string

	ctx    context.Context
	client *storage.Client
}

// NewGCS returns a new Google Cloud Storage client, creating bucket if not exists.
// 'key' is a Google Developers service account JSON key.
// Create/Download the key file from https://console.cloud.google.com/apis/credentials.
func NewGCS(ctx context.Context, bucket, scope string, key []byte, prefix string) (*GCS, error) {
	// key must be JSON-format as {"project_id":...}
	credMap := make(map[string]string)
	if err := json.Unmarshal(key, &credMap); err != nil {
		return nil, err
	}
	project, ok := credMap["project_id"]
	if !ok {
		return nil, fmt.Errorf("key has no project_id")
	}

	jwt, err := google.JWTConfigFromJSON(key, scope)
	if err != nil {
		return nil, err
	}
	cli, err := storage.NewClient(ctx, option.WithTokenSource(jwt.TokenSource(ctx)))
	if err != nil {
		return nil, err
	}

	glog.Infof("creating bucket %q", bucket)
	if err = cli.Bucket(bucket).Create(ctx, project, nil); err != nil {
		// expects; "googleapi: Error 409: You already own this bucket. Please select another name., conflict"
		// https://cloud.google.com/storage/docs/xml-api/reference-status#409conflict
		gerr, ok := err.(*googleapi.Error)
		if !ok {
			// failed to create/receive duplicate bucket
			return nil, err
		}
		if gerr.Code != 409 || gerr.Message != "You already own this bucket. Please select another name." {
			return nil, err
		}
		glog.Infof("%q already exists", bucket)
	} else {
		glog.Infof("created bucket %q", bucket)
	}

	return &GCS{projectID: project, bucket: bucket, prefix: prefix, ctx: ctx, client: cli}, nil
}

// Close closes the Client.
// Close need not be called at program exit.
func (g *GCS) Close() error {
	if g.client != nil {
		if err := g.client.Close(); err != nil {
			return err
		}
	}
	return nil
}

// Put writes 'data' with 'key' as a file name in the storage.
// The actual path will be namespaced with version and prefix.
func (g *GCS) Put(key string, data []byte) error {
	glog.Infof("writing key %q (value size: %s)", key, humanize.Bytes(uint64(len(data))))
	objectName := path.Join(v1, g.prefix, key)
	wr := g.client.Bucket(g.bucket).Object(objectName).NewWriter(g.ctx)
	// TODO: set wr.ContentType?
	if _, err := wr.Write(data); err != nil {
		return err
	}
	return wr.Close()
}

// Get returns data reader for the specified 'key'.
func (g *GCS) Get(key string) (io.ReadCloser, error) {
	glog.Infof("fetching key %q", key)
	objectName := path.Join(v1, g.prefix, key)
	return g.client.Bucket(g.bucket).Object(objectName).NewReader(g.ctx)
}

// Delete deletes data for the specified 'key'.
func (g *GCS) Delete(key string) error {
	glog.Infof("deleting key %q", key)
	objectName := path.Join(v1, g.prefix, key)
	return g.client.Bucket(g.bucket).Object(objectName).Delete(g.ctx)
}

func (g *GCS) deleteBucket() error {
	return g.client.Bucket(g.bucket).Delete(g.ctx)
}

func (g *GCS) list(prefix string) (int64, []string, error) {
	glog.Infof("listing by prefix %q", prefix)

	// recursively list all "files", not directory
	pfx := path.Join(v1, prefix)
	it := g.client.Bucket(g.bucket).Objects(g.ctx, &storage.Query{Prefix: pfx})

	var attrs []*storage.ObjectAttrs
	var err error
	for {
		var attr *storage.ObjectAttrs
		attr, err = it.Next()
		if err == iterator.Done {
			err = nil
			break
		}
		if err != nil {
			return 0, nil, err
		}
		attrs = append(attrs, attr)
	}

	keys := make([]string, 0, len(attrs))
	var size int64
	for _, v := range attrs {
		name := strings.Replace(v.Name, pfx+"/", "", 1)
		keys = append(keys, name)
		size += v.Size
	}
	return size, keys, nil
}

// List lists all keys.
func (g *GCS) List() ([]string, error) {
	_, keys, err := g.list(g.prefix)
	return keys, err
}

// TotalSize returns the total size of storage.
func (g *GCS) TotalSize() (int64, error) {
	size, _, err := g.list(g.prefix)
	return size, err
}

// CopyPrefix clones data from 'from' to the receiver storage.
// Objects are assumed to be copied within the same bucket.
func (g *GCS) CopyPrefix(from string) error {
	glog.Infof("copying from %q to %q", from, g.prefix)

	_, fromKeys, err := g.list(from)
	if err != nil {
		return err
	}
	for _, key := range fromKeys {
		srcObjectName := path.Join(v1, from, key)
		srcObject := g.client.Bucket(g.bucket).Object(srcObjectName)

		// copy src to dst
		dstObjectName := path.Join(v1, g.prefix, key)
		if _, err = g.client.Bucket(g.bucket).
			Object(dstObjectName).
			CopierFrom(srcObject).
			Run(g.ctx); err != nil {
			return err
		}
	}
	return nil
}
