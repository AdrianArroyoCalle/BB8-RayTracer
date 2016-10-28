@echo off
ffmpeg.exe -framerate 10 -i esfera%%d.png -c:v libx264 -r 30 -pix_fmt yuv420p salida.mp4