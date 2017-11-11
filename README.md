# MediaPlayer
Simple, usable Media Player

## How to Install
Create a folder called "media" in the main folder. Inside that folder, create two folders called "photos" and "music", in which media can be placed. Inside the "media" folder, insert a file called "games.txt". The file can be configured with a new game on each line, in the format:

`<name of game shown in app>,<url to game>`

## How to Use
First, run `npm install` to install dependencies.

Windows & Linux: Run `electron .` in the main directory to run the app (assuming Electron is installed globally), or open the packaged app (if provided).

Mac: Use the provided packaged app.

### Music Bar
The Music Bar (black bar at the top) controls the currently playing music.

- Playing Bar: Displays the currently playing song.
- Play/Pause Button: Toggles the play of the song.
- Fast Forward Button: Skips the current song, starts playing to the next song.
- Queue Button: Opens the Queue menu. From the Queue menu, any song in the queue can be removed or moved up and down the queue.
