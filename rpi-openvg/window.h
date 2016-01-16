#pragma once

namespace OpenVG
{

    class Window
    {
        public:
        Window(const Vector2ui& pos, const Vector2ui& size, unsigned int layer);
        ~Window();

        void SetPosition(const Vector2ui& pos);
        void SetSize(const Vector2ui& size);
        const Vector2ui& GetPosition() const;
        const Vector2ui& GetSize() const;

        void Show();
        void Hide();
        bool IsHidden() const;

        void Update();

        void Fill(const Vector2ui& pos, const Vector2ui& size, uint32_t color);

        private:
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
