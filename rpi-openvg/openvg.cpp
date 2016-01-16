#include <node.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <unistd.h>

#include "bcm_host.h"
#include "vgfont.h"

#include "vector2.h"
#include "window.h"

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

void init(Local<Object> exports)
{
    Window::Init(exports);
}

NODE_MODULE(openvg, init)

}  // namespace demo
