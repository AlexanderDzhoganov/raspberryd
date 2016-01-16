#include <cassert>

#include "vector2.h"
#include "bcm_host.h"
#include "vgfont.h"
#include "window.h"

namespace OpenVG
{

    bool Window::m_GxInitialized = false;
    Vector2ui Window::m_ScreenSize;

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

    Window::~Window()
    {
        graphics_display_resource(m_Handle, 0, m_Layer, 0, 0, GRAPHICS_RESOURCE_WIDTH, GRAPHICS_RESOURCE_HEIGHT, VC_DISPMAN_ROT0, 0);
        graphics_delete_resource(m_Handle);
    }

    void Window::SetPosition(const Vector2ui& pos)
    {
        m_Pos = pos;
        graphics_display_resource(m_Handle, 0, m_Layer, m_Pos.x, m_Pos.y, m_Size.x, m_Size.y, VC_DISPMAN_ROT0, m_IsHidden ? 0 : 1);
    }

    void Window::SetSize(const Vector2ui& size)
    {
        m_Size = size;
    }

    const Vector2ui& Window::GetPosition() const
    {
        return m_Pos;
    }

    const Vector2ui& Window::GetSize() const
    {
        return m_Size;
    }

    void Window::Show()
    {
        m_IsHidden = false;
        graphics_display_resource(m_Handle, 0, m_Layer, m_Pos.x, m_Pos.y, m_Size.x, m_Size.y, VC_DISPMAN_ROT0, m_IsHidden ? 0 : 1);
    }

    void Window::Hide()
    {
        m_IsHidden = true;
        graphics_display_resource(m_Handle, 0, m_Layer, m_Pos.x, m_Pos.y, m_Size.x, m_Size.y, VC_DISPMAN_ROT0, m_IsHidden ? 0 : 1);
    }

    bool Window::IsHidden() const
    {
        return m_IsHidden;
    }

    void Window::Update()
    {
        graphics_update_displayed_resource(m_Handle, 0, 0, 0, 0);
    }

    void Window::Fill(const Vector2ui& pos, const Vector2ui& size, uint32_t color)
    {
        graphics_resource_fill(m_Handle, pos.x, pos.y, size.x, size.y, color);
    }

}
