FROM ubuntu:jammy

RUN apt-get update \
  && apt-get install -y \
    software-properties-common \
    build-essential \
    python3-dev \
    ca-certificates \
    nano \
    wget \
    curl \
    bash \
    libsodium-dev \
    libgmp3-dev \
    libssl-dev

RUN apt-add-repository -y ppa:rael-gc/rvm && \
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -s && \
  apt-get install -y libssl1.0-dev nodejs

WORKDIR /nomp

COPY . .

RUN npm install

ENTRYPOINT ["node", "init.js"]

