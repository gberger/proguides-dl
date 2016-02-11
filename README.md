# proguides-dl

Download the videos from http://proguides.com, a site dedicated to League of Legends instructional videos.

## Prerequisites

* NodeJS
* `npm install`

## Steps to build the video list

You can skip these if videos.json is up to date enough. (See the date of the first video.)

1. Login to http://proguides.com and get your cookie. (If you don't know how, find a Chrome Extension for that.)
2. Create a new file called .env and put this in it:

```
PROGUIDES_COOKIE=YourCookieGoesHere
```

3. Run `node build-video-list.js > videos.json`


## Steps to download the videos in the list

1. Run `node dl-videos.js` and wait. It's gonna take a while!


## Steps to merge the video parts

Soon.
