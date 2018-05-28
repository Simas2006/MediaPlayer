# MediaPlayer/Server

Note: MediaPlayer/Server is not required in order to run MediaPlayer.

## How to Use

MediaPlayer/Server is intended to be used alongside the core. In the case you do not have the offline installation, the minimal directory tree is:
```
- %appdata%/mediaplayer/LocalMedia/
  - photos/
    - ...
  - music/
    - ...
  - games.txt
```

To start the server, run `./startServer <password> <port>`. The default port is 8000. As with the core, NodeJS is a prerequisite.

Login on the core by selecting `Login Online`, and enter the address, port, and password that you configured.
