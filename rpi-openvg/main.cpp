#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <unistd.h>

#include "bcm_host.h"
#include "vgfont.h"

static const char *strnchr(const char *str, size_t len, char c)
{
   const char *e = str + len;
   do {
      if (*str == c) {
         return str;
      }
   } while (++str < e);
   return NULL;
}

int32_t render_subtitle(GRAPHICS_RESOURCE_HANDLE img, const char *text, const int skip, const uint32_t text_size, const uint32_t y_offset)
{
   uint32_t text_length = strlen(text)-skip;
   uint32_t width=0, height=0;
   const char *split = text;
   int32_t s=0;
   int len = 0; // length of pre-subtitle
   uint32_t img_w, img_h;

   graphics_get_resource_size(img, &img_w, &img_h);

   if (text_length==0)
      return 0;
   while (split[0]) {
      s = graphics_resource_text_dimensions_ext(img, split, text_length-(split-text), &width, &height, text_size);
      if (s != 0) return s;
      if (width > img_w) {
         const char *space = strnchr(split, text_length-(split-text), ' ');
         if (!space) {
            len = split+1-text;
            split = split+1;
         } else {
            len = space-text;
            split = space+1;
         }
      } else {
         break;
      }
   }
   // split now points to last line of text. split-text = length of initial text. text_length-(split-text) is length of last line
   if (width) {
      s = graphics_resource_render_text_ext(img, (img_w - width)>>1, y_offset-height,
                                     GRAPHICS_RESOURCE_WIDTH,
                                     GRAPHICS_RESOURCE_HEIGHT,
                                     GRAPHICS_RGBA32(0xff,0xff,0xff,0xff), /* fg */
                                     GRAPHICS_RGBA32(0,0,0,0x80), /* bg */
                                     split, text_length-(split-text), text_size);
      if (s!=0) return s;
   }
   return render_subtitle(img, text, skip+text_length-len, text_size, y_offset - height);
}

GRAPHICS_RESOURCE_HANDLE img;
uint32_t width, height;
int LAYER = 200;

char* text = "The quick brown fox jumps over the lazy dog";

void setText(const char* newText)
{
   auto len = strlen(newText);
   text = new char[len+1];
   memcpy(text, newText, len * sizeof(char));
   text[len] = 0;
}

void initOpenVG()
{
   bcm_host_init();
   int s;

   s = gx_graphics_init("/home/nlight/raspberryd/rpi-openvg/");
   assert(s == 0);

   s = graphics_get_display_size(0, &width, &height);
   assert(s == 0);

   s = gx_create_window(0, width, height, GRAPHICS_RESOURCE_RGBA32, &img);
   assert(s == 0);

   graphics_resource_fill(img, 0, 0, width, height, GRAPHICS_RGBA32(0,0,0,0x00));

   graphics_display_resource(img, 0, LAYER, 0, 0, GRAPHICS_RESOURCE_WIDTH, GRAPHICS_RESOURCE_HEIGHT, VC_DISPMAN_ROT0, 1);
}

void renderNextFrame()
{
   uint32_t text_size = 50;

   uint32_t y_offset = height-60+text_size/2;
   graphics_resource_fill(img, 0, 0, width, height, GRAPHICS_RGBA32(0,0,0,0x00));
   // blue, at the top (y=40)
   graphics_resource_fill(img, 0, 40, width, 1, GRAPHICS_RGBA32(0,0,0xff,0xff));

   // green, at the bottom (y=height-40)
   graphics_resource_fill(img, 0, height-40, width, 1, GRAPHICS_RGBA32(0,0xff,0,0xff));

   // draw the subtitle text
   render_subtitle(img, text, 0, text_size,  y_offset);
   graphics_update_displayed_resource(img, 0, 0, 0, 0);
}

void disposeResources()
{
   graphics_display_resource(img, 0, LAYER, 0, 0, GRAPHICS_RESOURCE_WIDTH, GRAPHICS_RESOURCE_HEIGHT, VC_DISPMAN_ROT0, 0);
   graphics_delete_resource(img);
}
