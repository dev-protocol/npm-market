[![npm market](https://github.com/dev-protocol/npm-market/workflows/npm%20market/badge.svg)](https://github.com/dev-protocol/npm-market/actions)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# npm Market Contracts for Dev Protocol

## How to developing

First, fork this repository.

Then executing the following command will compile each contract.

```
git clone git@github.com:YOUR_NAMESPACE/npm-market.git
cd npm-market
npm i
npm run generate
```

run the following command to test each contract.

```
npm test
```

## How to develop included server

Require always following command.

```
cd serve
```

Then executing the following command will compile each file.

```
npm run build
```

Open a new console and execute the following command to starting a local server.

```
npm start
```
