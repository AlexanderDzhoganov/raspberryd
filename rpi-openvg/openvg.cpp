#include <node.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <unistd.h>

#include "bcm_host.h"
#include "vgfont.h"
#include "window.h"

void setText(const char*);
void initOpenVG();
void renderNextFrame();
void disposeResources();

namespace OpenVG
{

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Exception;
using v8::Number;

void RenderNextFrame(const FunctionCallbackInfo<Value>& args)
{
    renderNextFrame();
}

void SetText(const FunctionCallbackInfo<Value>& args)
{
    Isolate* isolate = args.GetIsolate();

    if (args.Length() == 0)
    {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
        return;
    }

    if (!args[0]->IsString())
    {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong arguments")));
        return;
    }
    v8::String::Utf8Value str(args[0]->ToString());
    setText(*str);
}

void init(Local<Object> exports)
{
    NODE_SET_METHOD(exports, "renderNextFrame", RenderNextFrame);
    NODE_SET_METHOD(exports, "setText", SetText);
    initOpenVG();
}

NODE_MODULE(openvg, init)

}  // namespace demo
