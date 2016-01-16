#!/bin/sh

scp -r ../openvg/ raspberry:/home/nlight/raspberryd/ && ssh raspberry 'killall -9 openvg & cd /home/nlight/raspberryd/openvg/ && make && echo Running && ./openvg'

