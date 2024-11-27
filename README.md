### Icon Font Subset
This repo contains the source code of [https://iconsubset.goodyduru.com/](https://iconsubset.goodyduru.com/).

The tool enables you to create an icon font subset entirely within the browser. It uses the excellent Python [fonttools](https://github.com/fonttools/fonttools) library via Web Assembly to achieve that.

You don't have to run any cli command to install this on your computer. It is a static site. All you need to do is download and point any simple webserver to its directory and that's it. Me, I ran `python3 -m http.server` within its directory in the course of its development and testing. I still do that.