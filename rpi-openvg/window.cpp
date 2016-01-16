#include <cassert>

#include "vector2.h"
#include "bcm_host.h"
#include "vgfont.h"
#include "window.h"

#include <iostream>

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
        uint32_t result = 0;
        auto ptr = (unsigned char*)(&result);
        ptr[0] = bytes[2];
        ptr[1] = bytes[1];
        ptr[2] = bytes[0];
        ptr[3] = bytes[3];
        return result;
    }

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
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        double x = args[0]->IsUndefined() ? 0.0 : args[0]->NumberValue();
        double y = args[1]->IsUndefined() ? 0.0 : args[1]->NumberValue();

        self->m_Pos.x = (uint32_t)x;
        self->m_Pos.y = (uint32_t)y;

        graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);
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
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());

        double width = args[0]->IsUndefined() ? 0.0 : args[0]->NumberValue();
        double height = args[1]->IsUndefined() ? 0.0 : args[1]->NumberValue();

        self->m_Size.x = (uint32_t)width;
        self->m_Size.y = (uint32_t)height;
        
        graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);
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
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        self->m_IsHidden = false;

        graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);
    }

    void Window::Hide(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        self->m_IsHidden = true;

        graphics_display_resource(self->m_Handle, 0, self->m_Layer, 
            self->m_Pos.x, self->m_Pos.y, self->m_Size.x, self->m_Size.y, 
            VC_DISPMAN_ROT0, self->m_IsHidden ? 0 : 1);
    }

    void Window::IsVisible(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Isolate* isolate = args.GetIsolate();
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        args.GetReturnValue().Set(Boolean::New(isolate, !self->m_IsHidden));
    }

    void Window::Update(const v8::FunctionCallbackInfo<v8::Value>& args)
    {
        Window* self = ObjectWrap::Unwrap<Window>(args.Holder());
        graphics_update_displayed_resource(self->m_Handle, 0, 0, 0, 0);
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

        graphics_resource_fill(self->m_Handle, (uint32_t)x, (uint32_t)y, (uint32_t)width, (uint32_t)height, color);
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

            graphics_resource_render_text_ext(
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
        result->Set(String::NewFromUtf8(isolate, "width"), Number::New(isolate, (double)self->m_Size.x));
        result->Set(String::NewFromUtf8(isolate, "height"), Number::New(isolate, (double)self->m_Size.y));
        args.GetReturnValue().Set(result);
    }

}
