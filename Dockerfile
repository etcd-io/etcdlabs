FROM ubuntu:16.10

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt-get -y update \
  && apt-get -y install \
  apt-utils \
  gcc \
  curl \
  bash \
  bash-completion \
  tar \
  build-essential \
  apt-transport-https \
  python \
  libssl-dev \
  mysql-client \
  nginx \
  && apt-get -y update \
  && apt-get -y upgrade \
  && apt-get -y autoremove \
  && apt-get -y autoclean \
  && mysql --version \
  && uname -a \
  && ulimit -n

# install go for backend
ENV GO_VERSION=1.8.3
ENV DOWNLOAD_URL=https://storage.googleapis.com/golang
RUN curl -s ${DOWNLOAD_URL}/go${GO_VERSION}.linux-amd64.tar.gz | tar -v -C /usr/local/ -xz
ENV GOPATH=/gopath
ENV PATH=$GOPATH/bin:/usr/local/go/bin:$PATH
RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"
RUN go version

# compile backend
RUN mkdir -p $GOPATH/src/github.com/coreos/etcdlabs
ADD . $GOPATH/src/github.com/coreos/etcdlabs
WORKDIR $GOPATH/src/github.com/coreos/etcdlabs

RUN go build -o ./backend-web-server -v ./cmd/backend-web-server

# install frontend dependencies
# 'node' needs to be in $PATH for 'yarn start' command
ENV NVM_DIR /usr/local/nvm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash \
  && source $NVM_DIR/nvm.sh \
  && nvm ls-remote \
  && nvm install 6.10.0 \
  && curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt-get -y update && apt-get -y install yarn \
  && yarn install \
  && npm rebuild node-sass \
  && npm install \
  && cp /usr/local/nvm/versions/node/v6.10.0/bin/node /usr/bin/node \
  && yarn --version \
  && node --version \
  && /usr/local/nvm/versions/node/v6.10.0/bin/npm --version

# configure reverse proxy
RUN mkdir -p /etc/nginx/sites-available/
ADD nginx.conf /etc/nginx/sites-available/default

EXPOSE 4200
EXPOSE 80

RUN pwd
