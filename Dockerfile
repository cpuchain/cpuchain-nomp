FROM ubuntu:jammy

RUN apt-get update \
  && apt-get install -y \
    software-properties-common \
    build-essential \
    python3-dev \
    ca-certificates \
    nano \
    curl \
    bash

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -s && \
  apt-get install -y nodejs

WORKDIR /nomp

COPY . .

RUN npm install

ENTRYPOINT ["node", "init.js"]
