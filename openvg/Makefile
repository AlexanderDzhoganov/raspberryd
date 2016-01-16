CFLAGS=-DSTANDALONE -D__STDC_CONSTANT_MACROS -D__STDC_LIMIT_MACROS -DTARGET_POSIX -D_LINUX -fPIC -DPIC -D_REENTRANT -D_LARGEFILE64_SOURCE -D_FILE_OFFSET_BITS=64 -U_FORTIFY_SOURCE -Wall -g -DHAVE_LIBOPENMAX=2 -DOMX -DOMX_SKIP64BIT -ftree-vectorize -pipe -DUSE_EXTERNAL_OMX -DHAVE_LIBBCM_HOST -DUSE_EXTERNAL_LIBBCM_HOST -DUSE_VCHIQ_ARM -Wno-psabi
LDFLAGS=-L/opt/vc/lib -lEGL -lGLESv2 -lbcm_host -lvcos -lvchiq_arm -lpthread -lrt -lm -lfreetype -lz
INCLUDES=-I/opt/vc/include/ -I/opt/vc/include/interface/vcos/pthreads -I/opt/vc/include/interface/vmcs_host/linux -I./ -I/usr/include/freetype2

all: main

main: main.cpp
	g++ $(CFLAGS) -std=c++1y -fpermissive $(INCLUDES) -c main.cpp -o main.o
	g++ $(CFLAGS) -std=c++1y -fpermissive $(INCLUDES) -c font.cpp -o font.o
	g++ $(CFLAGS) -std=c++1y -fpermissive $(INCLUDES) -c graphics.cpp -o graphics.o
	g++ $(CFLAGS) -std=c++1y -fpermissive $(INCLUDES) -c vgft.cpp -o vgft.o
	#g++ $(CFLAGS) -std=c++1y -fpermissive $(INCLUDES) -c ogl.cpp -o ogl.o 
	#g++ $(CFLAGS) -std=c++1y -fpermissive $(INCLUDES) -c rpiutil.cpp -o rpiutil.o 
	g++ -o openvg main.o font.o graphics.o vgft.o $(LDFLAGS)

install:
	install -m 755 -p openvg /usr/bin/
