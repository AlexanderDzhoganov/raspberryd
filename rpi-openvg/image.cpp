#include <cassert>

#include "vector2.h"
#include "bcm_host.h"
#include "vgfont.h"
#include "graphics_x_private.h"
#include "image.h"

#include <iostream>

#include <node.h>
#include <node_buffer.h>

void gx_priv_save(GX_CLIENT_STATE_T *state, GRAPHICS_RESOURCE_HANDLE res);
void gx_priv_restore(GX_CLIENT_STATE_T *state);

VCOS_STATUS_T gx_create_pbuffer( uint32_t width,
                                uint32_t height,
                                GRAPHICS_RESOURCE_TYPE_T image_type,
                                GRAPHICS_RESOURCE_HANDLE *resource_handle );

int32_t graphics_userblt(GRAPHICS_RESOURCE_TYPE_T src_type,
                         const void *src_data,
                         const uint32_t src_x,
                         const uint32_t src_y,
                         const uint32_t width,
                         const uint32_t height,
                         const uint32_t pitch,
                         GRAPHICS_RESOURCE_HANDLE dest,
                         const uint32_t x_pos,
                         const uint32_t y_pos );

namespace OpenVG
{

    using v8::Exception;
    using v8::Function;
    using v8::FunctionCallbackInfo;
    using v8::FunctionTemplate;
    using v8::Isolate;
    using v8::Local;
    using v8::Number;
    using v8::Boolean;
    using v8::Object;
    using v8::Persistent;
    using v8::String;
    using v8::Value;

    Persistent<Function> Image::constructor;

    Image::Image(const Vector2ui& size) : m_Size(size)
    {
        gx_create_pbuffer(size.x, size.y, GRAPHICS_RESOURCE_RGBA32, &m_Handle);
    }

    void Image::Init(Local<Object> exports) {
        Isolate* isolate = exports->GetIsolate();

        // Prepare constructor template
        Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
        tpl->SetClassName(String::NewFromUtf8(isolate, "Image"));
        tpl->InstanceTemplate()->SetInternalFieldCount(1);

        // Prototype
        NODE_SET_PROTOTYPE_METHOD(tpl, "getSize", GetSize);
        NODE_SET_PROTOTYPE_METHOD(tpl, "setPixels", SetPixels);

        constructor.Reset(isolate, tpl->GetFunction());
        exports->Set(String::NewFromUtf8(isolate, "Image"),
            tpl->GetFunction());
    }

    void Image::New(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();

        if (args.IsConstructCall()) {
            // Invoked as constructor: `new MyObject(...)`
            double width = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
            double height = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();

            Vector2ui size((uint32_t)width, (uint32_t)height);

            Image* obj = new Image(size);
            obj->Wrap(args.This());
            args.GetReturnValue().Set(args.This());
        } else {
            // Invoked as plain function `MyObject(...)`, turn into construct call.
            isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8(isolate, "Image constructor must be called with 'new'")));
        }
    }

    Image::~Image()
    {
        vgDestroyImage(m_Handle);
    }

    void Image::GetSize(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Image* self = ObjectWrap::Unwrap<Image>(args.Holder());

        auto result = Object::New(isolate);
        result->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, (double)self->m_Size.x));
        result->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, (double)self->m_Size.y));
        args.GetReturnValue().Set(result);
    }

    void Image::SetPixels(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Image* self = ObjectWrap::Unwrap<Image>(args.Holder());
        
        auto pixels = node::Buffer::Data(args[0]->ToObject());

        uint32_t srcWidth = args[1]->IsUndefined() ? self->m_Size.x : args[1]->NumberValue();
        uint32_t srcHeight = args[2]->IsUndefined() ? self->m_Size.y : args[2]->NumberValue();        

        auto copy = new char[srcWidth*srcHeight*4];

        for(auto y = 0; y < srcHeight; y++)
        for(auto x = 0; x < srcWidth; x++)
        {
            char r = pixels[(x * 4) + (y * srcWidth * 4) + 0];
            char g = pixels[(x * 4) + (y * srcWidth * 4) + 1];
            char b = pixels[(x * 4) + (y * srcWidth * 4) + 2];
            char a = pixels[(x * 4) + (y * srcWidth * 4) + 3];

            copy[(x * 4) + ((srcHeight - y - 1) * srcWidth * 4) + 0] = a;
            copy[(x * 4) + ((srcHeight - y - 1) * srcWidth * 4) + 1] = b;
            copy[(x * 4) + ((srcHeight - y - 1) * srcWidth * 4) + 2] = g;
            copy[(x * 4) + ((srcHeight - y - 1) * srcWidth * 4) + 3] = r;
        }

        auto result = graphics_userblt(GRAPHICS_RESOURCE_RGBA32, copy, 0, 0, srcWidth, srcHeight, srcWidth * 4, self->m_Handle, 0, 0);

        delete [] copy;

        args.GetReturnValue().Set(Number::New(isolate, (double)result));
    }

}
