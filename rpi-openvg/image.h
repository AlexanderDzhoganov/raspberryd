#pragma once

#include <node.h>
#include <node_object_wrap.h>
#include "graphics_x_private.h"

namespace OpenVG
{

    class Image : public node::ObjectWrap
    {
        public:
        static void Init(v8::Local<v8::Object> exports);

        explicit Image(const Vector2ui& size);
        ~Image();

        static void New(const v8::FunctionCallbackInfo<v8::Value>& args);

        static void SetPixels(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void GetSize(const v8::FunctionCallbackInfo<v8::Value>& args);

        static v8::Persistent<v8::Function> constructor;

        Vector2ui m_Size;

        GRAPHICS_RESOURCE_HANDLE m_Handle;
    };

}
