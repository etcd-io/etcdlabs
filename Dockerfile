FROM fedora:28

RUN dnf check-update || true \
  && dnf install --assumeyes \
  git curl wget mercurial meld gcc gcc-c++ which \
  gcc automake autoconf dh-autoreconf libtool libtool-ltdl \
  tar unzip gzip \
  nginx sudo \
  && dnf check-update || true \
  && dnf upgrade --assumeyes || true \
  && dnf autoremove --assumeyes || true \
  && dnf clean all || true \
  && dnf reinstall which || true

# Install go for backend
ENV GOROOT /usr/local/go
ENV GOPATH /gopath
ENV PATH ${GOPATH}/bin:${GOROOT}/bin:${PATH}
ENV GO_VERSION 1.10.2
ENV GO_DOWNLOAD_URL https://storage.googleapis.com/golang
RUN rm -rf ${GOROOT} \
  && curl -s ${GO_DOWNLOAD_URL}/go${GO_VERSION}.linux-amd64.tar.gz | tar -v -C /usr/local/ -xz \
  && mkdir -p ${GOPATH}/src ${GOPATH}/bin \
  && go version

# Compile backend
RUN mkdir -p $GOPATH/src/github.com/coreos/etcdlabs
ADD . $GOPATH/src/github.com/coreos/etcdlabs

RUN pushd $GOPATH/src/github.com/coreos/etcdlabs \
  && echo "Updating Go dependencies..." \
  && ./scripts/dep/go.sh \
  && go build -o ./backend-web-server -v ./cmd/backend-web-server \
  && popd

# Install Angular, NodeJS for frontend
# 'node' needs to be in $PATH for 'yarn start' command
ENV NVM_DIR /usr/local/nvm
RUN dnf install --assumeyes npm \
  && pushd ${GOPATH}/src/github.com/coreos/etcdlabs \
  && curl https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | /bin/bash \
  && echo "Running nvm scripts..." \
  && source $NVM_DIR/nvm.sh \
  && nvm ls-remote \
  && nvm install v9.5.0 \
  && curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo \
  && dnf install yarn --assumeyes \
  && echo "Updating frontend dependencies..." \
  && rm -rf ./node_modules \
  && yarn install \
  && npm rebuild node-sass --force \
  && npm install \
  && nvm alias default 9.5.0 \
  && nvm alias default node \
  && which node \
  && node -v \
  && cp /usr/local/nvm/versions/node/v9.5.0/bin/node /usr/bin/node \
  && popd

# Configure reverse proxy
RUN mkdir -p /etc/nginx/sites-available/
ADD nginx.conf /etc/nginx/sites-available/default
