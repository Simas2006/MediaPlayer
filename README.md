# MediaPlayer
Simple, usable Media Player

## How to Install
Create a folder called "media" in the main folder. Inside that folder, create two folders called "photos" and "music", in which media can be placed. Inside the "media" folder, insert a file called "games.txt". The file can be configured with a new game on each line, in the format
`<name of game shown in app>,<url to game>`

To initialize, run `npm install && npm install -g electron`.

## How to Use
To open, run `electron .` in the active directory.

### Photos
Opening photos will show a list of your photo albums. Clicking on any will open the photo viewer. The control panel at the top has four buttons:
  - ←: Go back one image.
  - →: Go forward one image (shortcut: clicking on the image).
  - ⏩: Start a slideshow. Clicks through the images at a rate of 1/5s by default.
  - ⤿: Rotate the image 90 degrees.

### Music
Opening music will show a list of your music albums. Clicking on any will show a list of songs inside the album. Select songs (or click Select All). Clicking Add To Queue will add the selected songs to the queue to be played.

#### Music Bar
The music bar at the top of the screen controls the currently playing music. It is divided into three sections.
  - First section:
    - Q: Opens the queue.
    - ⏪: Scrolls to the beginning of the song.
    - ▶/||: Toggles the playing/paused state of the song.
    - ⏩: Skips the current song.
  - Second section:
    - Text: The name of the currently playing song (if no song, "Not Playing")
    - Gray Slider: A progress bar of the song. Can be clicked to skip to any timestamp.
    - Timestamps: The first shows the current progress, the second shows the remaining progress.
  - Third section:
    - Gray Slider: A bar representing the current volume. Can be clicked to control the current volume.
    - Mute button: Can be clicked to set the volume to 0%.

#### Queue
The queue (which appears on the left side) displays the currently playing songs. Two buttons at the top control the queue in general:
  - X: Clear the queue and remove the currently playing song.
  - 🔀: Shuffle the queue.
Each song has buttons which control itself in the queue.
  - ⇡: Put the song at the top of the queue.
  - ↑: Move the song up one space in the queue.
  - ↓: Move the song down one space in the queue.
  - X: Removes the song from the queue.
  - AX: Removes the song, as well as any song in the same album, from the queue.

### Games/YouTube
Opening games will show a list of all games stored in `games.txt`. Upon clicking on any, it will be showed in a smaller window underneath. Games can be any accessible website. A shortcut is placed to YouTube from the main page for your convenience.

Upon opening a game, the music will pause playback and will resume when you exit. Playback can be re-enabled from the music bar if desired.

## Contributing
MediaPlayer is not open to contributions at this moment.
