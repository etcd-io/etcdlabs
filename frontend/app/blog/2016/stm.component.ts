import { Component } from '@angular/core';
import { BlogComponent } from '../blog.component';

@Component({
    selector: 'stm',
    templateUrl: 'stm.component.html',
})
export class STMComponent extends BlogComponent {
    constructor() {
        super();
    }

    getCode1() {
        return `import (
    "fmt"
    "encoding/binary"
    v3 "github.com/coreos/etcd/clientv3"
)

func toUInt64(v []byte) uint64 { x, _ := binary.UVarint(v); return x }
func fromUInt64(v uint64) []byte {
    b := make([]byte, binary.MaxVarintLen64);
    return b[:binary.PutUvarint(b, v)]
}

func nosyncXfer(etcd *v3.Client, from, to string, amount uint) (err error) {
    var fromKV, toKV *v3.GetResponse
    if fromKV, err = b.etcd.Get(context.TODO(), from); err != nil {
        return err
    }
    if toKV, err = b.etcd.Get(context.TODO(), to); err != nil {
        return err
    }
    fromV, toV := toUInt64(fromKV.Value), toUint64(toKV.Value)
    if fromV < amount {
        return fmt.Errorf("insufficient value")
    }
    if _, err = b.etcd.Put(context.TODO(), to, fromUInt64(toV + amount)); err != nil {
        return err
    }
    _, err = b.etcd.Put(context.TODO(), from, fromUInt64(fromV - amount))
    return err
}
`;
    }

    getCode2() {
        return `func txnXfer(etcd *v3.Client, from, to string, amount uint) (error) {
    for {
        if ok, err := doTxnXfer(etcd, from, to amount); err != nil {
            return err
        } else if ok {
            return nil
        }
    }
}

func doTxnXfer(etcd *v3.Client, from, to string, amount uint) (bool, error) {
    getresp, err := etcd.Txn(ctx.TODO()).Then(OpGet(from), OpGet(to)).Commit()
    if err != nil {
         return false, err
    }
    fromKV := getresp.Responses[0].GetRangeResponse().Kvs[0]
    toKV := getresp.Responses[1].GetRangeResponse().Kvs[1]
    fromV, toV := toUInt64(fromKV.Value), toUint64(toKV.Value)
    if fromV < amount {
        return false, fmt.Errorf(“insufficient value”)
    }
    txn := etcd.Txn(ctx.TODO()).If(
        v3.Compare(v3.ModRevision(from), “=”, fromKV.ModRevision),
        v3.Compare(v3.ModRevision(to), “=”, toKV.ModRevision))
    txn = txn.Then(
        OpPut(from, fromUint64(fromV - amount)),
        OpPut(to, fromUint64(toV - amount))
    putresp, err := txn.Commit()
    if err != nil {
        return false, err
    }
    return putresp.Succeeded, nil
}
`;
    }

    getCode3() {
        return `{a:2,b:2}`;
    }

    getCode4() {
        return `import conc “github.com/coreos/etcd/clientv3/concurrency”
func stmXfer(e *v3.Client, from, to string, amount uint) error {
    return <-conc.NewSTMRepeatable(context.TODO(), e, func(s *conc.STM) error {
        fromV := toUInt64(s.Get(from))
        toV := toUInt64(s.Get(to))
        if fromV < amount {
            return fmt.Errorf(“insufficient value”)
        }
        s.Put(to, fromUInt64(toV + amount))
        s.Put(from, fromUInt64(fromV - amount))
        return nil
    })
}
`;
    }

    getCode5() {
        return `func NewSTM(ctx context.Context, c *v3.Client, apply func(*STM) error) <-chan error {
    errc := make(chan error, 1)
    go func() {
        defer func() {
            if r := recover(); r != nil {
                e, ok := r.(stmError)
                if !ok { panic(r) }
                errc <- e.err
            }
        }()
        var err error
        for {
            s := &STM{c, ctx, make(map[string]*v3.GetResponse), make(map[string]string)}
            if err = apply(s); err != nil { break }
            if s.commit() { break }
        }
    }()
    return errc
}
`;
    }

    getCode6() {
        return `type STM struct {
   c *v3.Client
   ctx context.Context
   rset map[string]*v3.GetResponse
   wset map[string]string
}
`;
    }

    getCode7() {
        return `type stmError struct { err error}

func (s *STM) Get(key string) string {
    if wv, ok := s.wset[key]; ok {
       return wv
    }
    if rv, ok := s.rset[key]; ok {
        return string(rv.Kvs[0].Value)
    }
    rk, err := s.c.Get(s.ctx, key, v3.WithSerializable())
    if err != nil {
        panic(err)
    }
    s.rset[key] = rk
    return string(rk.Kvs[0].Value)
}

func (s *STM) Put(key, val string) { s.wset[key] = val }
`;
    }

    getCode8() {
        return `func (s *STM) commit() bool {
    cs := make([]v3.Cmp, 0, len(s.rset))
    for k, rk := range s.rset {
        cs = append(cs, v3.Compare(v3.ModRevision(k), “=”, rk.Kvs[0].ModRevision))
    }
    puts := make([]v3.Op, 0, len(s.wset))
    for k, v := range s.wset {
        puts = append(puts, v3.OpPut(k, v))
    }
    txnresp, err := s.c.Txn(s.ctx).If(cs…).Then(puts…).Commit()
    if err != nil {
        panic(err)
    }
    return txnresp.Succeeded
}`;
    }
}
