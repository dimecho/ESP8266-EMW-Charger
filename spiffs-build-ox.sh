#!/bin/bash

#==============
#Copy Files
#==============
rm -rf ./spiffs
cp -rf  ./Web ./spiffs
rm ./spiffs/img/screenshot.png

#================
#Clean PHP
#================
for f in $(find ./spiffs -name '*.php'); do
    php=false
    while read -r line; do
        if [[ $line == *"<?php"* ]]; then
            php=true
        fi
        if [[ $line == *"?>"* ]]; then
            php=false
        fi
        if [ $php = false ]; then
            echo "$line" >> "$f.p"
        else
            if [[ $line == *"include"* ]]; then
                #echo "<?php" >> "$f.p"
                echo "$line" >> "$f.p"
            else
                if [[ $line == *"<?php"* ]]; then
                    echo "<?php" >> "$f.p"
                fi
            fi
        fi
    done < "$f"
    mv "$f.p" "$f"
done

if [ ! -f tools/mkspiffs ]; then
    curl -L -o tools/mkspiffs-0.2.3-arduino-esp8266-osx.tar.gz -k -C - https://github.com/igrr/mkspiffs/releases/download/0.2.3/mkspiffs-0.2.3-arduino-esp8266-osx.tar.gz
    cd tools
    gunzip -c mkspiffs-0.2.3-arduino-esp8266-osx.tar.gz | tar xopf -
    mv mkspiffs-0.2.3-arduino-esp8266-osx/mkspiffs ./
    rm -rf mkspiffs-0.2.3-arduino-esp8266-osx
    rm -rf mkspiffs-0.2.3-arduino-esp8266-osx.tar.gz
    cd ../
fi

#==============
#Compress Files
#==============
for f in $(find spiffs -type f -name '*.*' ! -name '*.php'); do
    gzip "$f"
    mv "$f.gz" "$f"
done

./tools/mkspiffs -c ./spiffs/ -b 8192 -p 256 -s 600000 flash-spiffs.bin