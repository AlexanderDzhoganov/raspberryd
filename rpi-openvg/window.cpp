#include <cassert>

#include "vector2.h"
#include "bcm_host.h"
#include "vgfont.h"
#include "graphics_x_private.h"
#include "window.h"
#include "image.h"

#include <iostream>

#include <node.h>
#include <node_buffer.h>

void gx_priv_save(GX_CLIENT_STATE_T *state, GRAPHICS_RESOURCE_HANDLE res);
void gx_priv_restore(GX_CLIENT_STATE_T *state);

int32_t graphics_bitblt( const GRAPHICS_RESOURCE_HANDLE src,
                         const uint32_t x, // offset within source
                         const uint32_t y, // offset within source
                         const uint32_t width,
                         const uint32_t height,
                         GRAPHICS_RESOURCE_HANDLE dest,
                         const uint32_t x_pos,
                         const uint32_t y_pos )

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

    uint32_t RGBAtoBGRA(uint32_t color)
    {
        auto bytes = (unsigned char*)(&color);
        return GRAPHICS_RGBA32(bytes[3], bytes[2], bytes[1], bytes[0]);
    }

    bool Window::m_GxInitialized = false;
    Vector2ui Window::m_ScreenSize;

    Persistent<Function> Window::constructor;

    Window::Window(const Vector2ui& pos, const Vector2ui& size, unsigned int layer) : m_Pos(pos), m_Size(size), m_Layer(layer)
    {
        if(!m_GxInitialized)
        {
            InitializeGx();
        }

        auto s = gx_create_window(0, size.x, size.y, GRAPHICS_RESOURCE_RGBA32, &m_Handle);
        assert(s == 0);

        graphics_resource_fill(m_Handle, 0, 0, size.x, size.y, GRAPHICS_RGBA32(0,0,0,0x00));
        graphics_display_resource(m_Handle, 0, m_Layer, m_Pos.x, m_Pos.y, GRAPHICS_RESOURCE_WIDTH, GRAPHICS_RESOURCE_HEIGHT, VC_DISPMAN_ROT0, 1);
    }

    void Window::InitializeGx()
    {
        bcm_host_init();
        int s;

        s = gx_graphics_init("/home/nlight/raspberryd/rpi-openvg/");
        assert(s == 0);

        s = graphics_get_display_size(0, &m_ScreenSize.x, &m_ScreenSize.y);
        assert(s == 0);
    }

    void Window::Init(Local<Object> exports) {
        Isolate* isolate = exports->GetIsolate();

        // Prepare constructor template
        Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
        tpl->SetClassName(String::NewFromUtf8(isolate, "Window"));
        tpl->InstanceTemplate()->SetInternalFieldCount(1);

        // Prototype
        NODE_SET_PROTOTYPE_METHOD(tpl, "setPosition", SetPosition);
        NODE_SET_PROTOTYPE_METHOD(tpl, "getPosition", GetPosition);
        NODE_SET_PROTOTYPE_METHOD(tpl, "setSize", SetSize);
        NODE_SET_PROTOTYPE_METHOD(tpl, "getSize", GetSize);
        NODE_SET_PROTOTYPE_METHOD(tpl, "getDisplaySize", GetDisplaySize);
        NODE_SET_PROTOTYPE_METHOD(tpl, "show", Show);
        NODE_SET_PROTOTYPE_METHOD(tpl, "hide", Hide);
        NODE_SET_PROTOTYPE_METHOD(tpl, "isVisible", IsVisible);
        NODE_SET_PROTOTYPE_METHOD(tpl, "update", Update);
        NODE_SET_PROTOTYPE_METHOD(tpl, "fill", Fill);
        NODE_SET_PROTOTYPE_METHOD(tpl, "drawText", DrawText);
        NODE_SET_PROTOTYPE_METHOD(tpl, "measureText", MeasureText);
        NODE_SET_PROTOTYPE_METHOD(tpl, "blitPixels", BlitPixels);
        NODE_SET_PROTOTYPE_METHOD(tpl, "blitImage", BlitImage);
        NODE_SET_PROTOTYPE_METHOD(tpl, "drawImage", DrawImage);

        constructor.Reset(isolate, tpl->GetFunction());
        exports->Set(String::NewFromUtf8(isolate, "Window"),
            tpl->GetFunction());
    }

    void Window::New(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();

        if (args.IsConstructCall()) {
            // Invoked as constructor: `new MyObject(...)`
            double x = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
            double y = args[1]->IsUndefined() ? 0 : args[1]->NumberValue();
            double width = args[2]->IsUndefined() ? (double)m_ScreenSize.x : args[2]->NumberValue();
            double height = args[3]->IsUndefined() ? (double)m_ScreenSize.y : args[3]->NumberValue();
            double layer = args[4]->IsUndefined() ? 10.0 : args[4]->NumberValue();

            Vector2ui pos((uint32_t)x, (uint32_t)y);
            Vector2ui size((uint32_t)width, (uint32_t)height);

            Window* obj = new Window(pos, size, (uint32_t)layer);
            obj->Wrap(args.This());
            args.GetReturnValue().Set(args.This());
        } else {
            // Invoked as plain function `MyObject(...)`, turn into construct call.
            isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8(isolate, "Window constructor must be called with 'new'")));
        }
    }

    Window::~Window()
    {
        graphics_display_resource(m_Handle, 0, m_Layer, 0, 0, GRAPHICS_RESOURCE_WIDTH, GRAPHICS_RESOURCE_HEIGHT, VC_DISPMAN_ROT0, 0);
        graphics_delete_resource(m_Handle);
    }

    void Window::SetPosition(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        double x = args[0]->IsUndefined() ? 0.0 : args[0]->NumberValue();
        double y = args[1]->IsUndefined() ? 0.0 : args[1]->NumberValue();

        self->m_Pos.x = (uint32_t)x;
        self->m_Pos.y = (uint32_t)y;

        auto status = graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);
        args.GetReturnValue().Set(Number::New(isolate, (double)status));
    }

    void Window::GetPosition(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        auto result = Object::New(isolate);
        result->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, (double)self->m_Pos.x));
        result->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, (double)self->m_Pos.y));
        args.GetReturnValue().Set(result);
    }

    void Window::SetSize(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        double width = args[0]->IsUndefined() ? 0.0 : args[0]->NumberValue();
        double height = args[1]->IsUndefined() ? 0.0 : args[1]->NumberValue();

        self->m_Size.x = (uint32_t)width;
        self->m_Size.y = (uint32_t)height;
        
        auto status = graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);
        args.GetReturnValue().Set(Number::New(isolate, (double)status));
    }

    void Window::GetSize(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        auto result = Object::New(isolate);
        result->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, (double)self->m_Size.x));
        result->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, (double)self->m_Size.y));
        args.GetReturnValue().Set(result);
    }

    void Window::GetDisplaySize(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        auto result = Object::New(isolate);
        result->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, (double)self->m_ScreenSize.x));
        result->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, (double)self->m_ScreenSize.y));
        args.GetReturnValue().Set(result);
    }

    void Window::Show(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        self->m_IsHidden = false;

        auto status = graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);
        args.GetReturnValue().Set(Number::New(isolate, (double)status));
    }

    void Window::Hide(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        self->m_IsHidden = true;

        auto status = graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);

        args.GetReturnValue().Set(Number::New(isolate, (double)status));
    }

    void Window::IsVisible(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        args.GetReturnValue().Set(Boolean::New(isolate, !self->m_IsHidden));
    }

    void Window::Update(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        auto status = graphics_update_displayed_resource(self->m_Handle, 0, 0, 0, 0);
        args.GetReturnValue().Set(Number::New(isolate, (double)status));
    }

    uint32_t ExtractColor(Isolate* isolate, const v8::Local<v8::Object>& obj)
    {
        auto r_obj = obj->Get(String::NewFromUtf8(isolate, "r"));
        auto r = r_obj->IsUndefined() ? 0.0 : r_obj->NumberValue();
        auto g_obj = obj->Get(String::NewFromUtf8(isolate, "g"));
        auto g = g_obj->IsUndefined() ? 0.0 : g_obj->NumberValue();
        auto b_obj = obj->Get(String::NewFromUtf8(isolate, "b"));
        auto b = b_obj->IsUndefined() ? 0.0 : b_obj->NumberValue();
        auto a_obj = obj->Get(String::NewFromUtf8(isolate, "a"));
        auto a = a_obj->IsUndefined() ? 0.0 : a_obj->NumberValue();

        return GRAPHICS_RGBA32((unsigned char)(r * 255.0), (unsigned char)(g * 255.0),
                (unsigned char)(b * 255.0), (unsigned char)(a * 255.0));
    }

    void Window::Fill(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        double x = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
        double y = args[1]->IsUndefined() ? 0 : args[1]->NumberValue();
        double width = args[2]->IsUndefined() ? (double)m_ScreenSize.x : args[2]->NumberValue();
        double height = args[3]->IsUndefined() ? (double)m_ScreenSize.y : args[3]->NumberValue();

        auto color = GRAPHICS_RGBA32(0xFF, 0, 0xFF, 0xFF);
        if(!args[4]->IsUndefined())
        {  
            color = ExtractColor(isolate, args[4]->ToObject());
        }

        auto status = graphics_resource_fill(self->m_Handle, 
            (uint32_t)x, (uint32_t)y, (uint32_t)width, (uint32_t)height, color);
        args.GetReturnValue().Set(Number::New(isolate, (double)status));
    }

    void Window::DrawText(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        double x = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
        double y = args[1]->IsUndefined() ? 0 : args[1]->NumberValue();

        double size = args[3]->IsUndefined() ? 50.0 : args[3]->NumberValue();

        auto fgColor = GRAPHICS_RGBA32(0,0,0,0xff);
        if(!args[4]->IsUndefined())
        {
            fgColor = ExtractColor(isolate, args[4]->ToObject());
        }

        auto bgColor = GRAPHICS_RGBA32(0,0,0,0);

        if(!args[5]->IsUndefined())
        {
            bgColor = ExtractColor(isolate, args[5]->ToObject());
        }

        if(!args[2]->IsUndefined())
        {
            auto str = args[2]->ToString();
            v8::String::Utf8Value text(str);

            auto status = graphics_resource_render_text_ext(
                self->m_Handle, 
                x,
                y,
                GRAPHICS_RESOURCE_WIDTH,
                GRAPHICS_RESOURCE_HEIGHT,
                fgColor,
                bgColor,
                *text,
                str->Length(),
                size
            );

           args.GetReturnValue().Set(Number::New(isolate, (double)status));
        } else {
           args.GetReturnValue().Set(Number::New(isolate, 1.0));
        }
    }

    void Window::MeasureText(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        auto str = args[0]->ToString();
        v8::String::Utf8Value text(str);

        auto size = args[1]->IsUndefined() ? 50.0 : args[1]->NumberValue();

        uint32_t width = 0, height = 0;
        graphics_resource_text_dimensions_ext(self->m_Handle, *text, str->Length(), &width, &height, (uint32_t)size);
        auto result = Object::New(isolate);
        result->Set(String::NewFromUtf8(isolate, "width"), Number::New(isolate, (double)width));
        result->Set(String::NewFromUtf8(isolate, "height"), Number::New(isolate, (double)height));
        args.GetReturnValue().Set(result);
    }

    void Window::BlitPixels(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        
        auto pixels = node::Buffer::Data(args[0]->ToObject());

        uint32_t srcWidth = args[1]->IsUndefined() ? 0 : args[1]->NumberValue();
        uint32_t srcHeight = args[2]->IsUndefined() ? 0 : args[2]->NumberValue();        

        uint32_t dstX = args[3]->IsUndefined() ? 0 : args[3]->NumberValue();
        uint32_t dstY = args[4]->IsUndefined() ? 0 : args[4]->NumberValue();
        uint32_t dstWidth = args[5]->IsUndefined() ? srcWidth : args[5]->NumberValue();
        uint32_t dstHeight = args[6]->IsUndefined() ? srcHeight : args[6]->NumberValue();

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

        GX_CLIENT_STATE_T save;
        gx_priv_save(&save, self->m_Handle);

        vgGetError();
        vgLoadIdentity();
        vgWritePixels(copy, srcWidth * 4, VG_sRGBA_8888, dstX, m_ScreenSize.y - dstY - srcHeight, dstWidth, dstHeight);

        delete [] copy;

        auto err = vgGetError();
        gx_priv_restore(&save);
        args.GetReturnValue().Set(Number::New(isolate, (double)err));
    }

    void Window::BlitImage(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        
        uint32_t srcX = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
        uint32_t srcY = args[1]->IsUndefined() ? 0 : args[1]->NumberValue();        
        uint32_t dstX = args[2]->IsUndefined() ? 0 : args[2]->NumberValue();
        uint32_t dstY = args[3]->IsUndefined() ? 0 : args[3]->NumberValue();

        Image* img = ObjectWrap::Unwrap<Image>(args[4]->ToObject());

        auto status = graphics_bitblt(img->m_Handle, srcX, srcY, img->m_Size.x, img->m_Size.y, m_Handle, dstX, dstY);

        args.GetReturnValue().Set(Number::New(isolate, (double)status));
    }

    void Window::DrawImage(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        
        Image* img = ObjectWrap::Unwrap<Image>(args[4]->ToObject());
        auto& size = img->m_Size;

        uint32_t dstX = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
        uint32_t dstY = args[1]->IsUndefined() ? 0 : args[1]->NumberValue();
        uint32_t dstWidth = args[2]->IsUndefined() ? size.x : args[2]->NumberValue();
        uint32_t dstHeight = args[3]->IsUndefined() ? size.y : args[3]->NumberValue();

        GX_CLIENT_STATE_T save;
        gx_priv_save(&save, self->m_Handle);

        vgGetError();
        vgLoadIdentity();
        vgScale((float)dstWidth / (float)size.x, (float)dstHeight / (float)size.y);
        vgTranslate(dstX, dstY);
        vgDrawImage(img->m_Handle);

        auto err = vgGetError();
        gx_priv_restore(&save);
        args.GetReturnValue().Set(Number::New(isolate, (double)err));
    }

}
