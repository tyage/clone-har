# Clone website to local

## Usage

1. Save HAR file
    1. notice: Chrome's inspector provides a way to save HAR file in network tab
1. run this command and edit `/etc/hosts` and nginx config

```sh
$ node ./capture [path to HAR file]
```

## Requirement

1. node.js
1. wget
1. nginx
