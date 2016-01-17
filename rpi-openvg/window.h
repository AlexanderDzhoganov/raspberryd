#pragma once

#include <node.h>
#include <node_object_wrap.h>

namespace OpenVG
{

    class Window : public node::ObjectWrap
    {
        public:
        static void Init(v8::Local<v8::Object> exports);

        explicit Window(const Vector2ui& pos, const Vector2ui& size, unsigned int layer);
        ~Window();

        static void New(const v8::FunctionCallbackInfo<v8::Value>& args);

        static void SetPosition(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void GetPosition(const v8::FunctionCallbackInfo<v8::Value>& args);

        static void SetSize(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void GetSize(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void GetDisplaySize(const v8::FunctionCallbackInfo<v8::Value>& args);
  
        static void Show(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void Hide(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void IsVisible(const v8::FunctionCallbackInfo<v8::Value>& args);

        static void Update(const v8::FunctionCallbackInfo<v8::Value>& args);

        static void Fill(const v8::FunctionCallbackInfo<v8::Value>& args);

        static void DrawText(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void MeasureText(const v8::FunctionCallbackInfo<v8::Value>& args);

        static void BlitPixels(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void BlitImage(const v8::FunctionCallbackInfo<v8::Value>& args);
        static void DrawImage(const v8::FunctionCallbackInfo<v8::Value>& args);

        static v8::Persistent<v8::Function> constructor;

        static void InitializeGx();

        Vector2ui m_Pos;
        Vector2ui m_Size;
        unsigned int m_Layer = 10;
        bool m_IsHidden = false;

        GRAPHICS_RESOURCE_HANDLE m_Handle;

        static Vector2ui m_ScreenSize;
        static bool m_GxInitialized;
    };

}
