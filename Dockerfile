FROM ubuntu:17.10

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt-get -y update \
  && apt-get -y install \
  build-essential \
  gcc \
  apt-utils \
  pkg-config \
  software-properties-common \
  apt-transport-https \
  libssl-dev \
  sudo \
  bash \
  bash-completion \
  curl \
  wget \
  tar \
  unzip \
  git \
  python \
  libssl-dev \
  nginx \
  && apt-get -y update \
  && apt-get -y upgrade \
  && apt-get -y autoremove \
  && apt-get -y autoclean \
  && uname -a \
  && ulimit -n

# Install go for backend
ENV GOROOT /usr/local/go
ENV GOPATH /gopath
ENV PATH ${GOPATH}/bin:${GOROOT}/bin:${PATH}
ENV GO_VERSION 1.10.3
ENV GO_DOWNLOAD_URL https://storage.googleapis.com/golang
RUN rm -rf ${GOROOT} \
  && curl -s ${GO_DOWNLOAD_URL}/go${GO_VERSION}.linux-amd64.tar.gz | tar -v -C /usr/local/ -xz \
  && mkdir -p ${GOPATH}/src ${GOPATH}/bin \
  && go version

# Compile backend
RUN mkdir -p $GOPATH/src/github.com/etcd-io/etcdlabs
ADD . $GOPATH/src/github.com/etcd-io/etcdlabs

RUN pushd $GOPATH/src/github.com/etcd-io/etcdlabs \
  && echo "Updating Go dependencies..." \
  && ./scripts/dep/go.sh \
  && go build -o ./backend-web-server -v ./cmd/backend-web-server \
  && popd

# Install Angular, NodeJS for frontend
# 'node' needs to be in $PATH for 'yarn start' command
ENV NVM_DIR /usr/local/nvm
RUN pushd ${GOPATH}/src/github.com/etcd-io/etcdlabs \
  && curl https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | /bin/bash \
  && echo "Running nvm scripts..." \
  && source $NVM_DIR/nvm.sh \
  && nvm ls-remote \
  && nvm install v9.11.2 \
  && curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt-get -y update && apt-get -y install yarn \
  && echo "Updating frontend dependencies..." \
  && rm -rf ./node_modules \
  && yarn install \
  && npm rebuild node-sass --force \
  && npm install \
  && nvm alias default 9.5.0 \
  && nvm alias default node \
  && which node \
  && node -v \
  && cp /usr/local/nvm/versions/node/v9.11.2/bin/node /usr/bin/node \
  && popd

# Configure reverse proxy
RUN mkdir -p /etc/nginx/sites-available/
ADD nginx.conf /etc/nginx/sites-available/default
