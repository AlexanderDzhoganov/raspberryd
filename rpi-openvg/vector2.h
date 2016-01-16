#pragma once

namespace OpenVG
{

    template <typename T>
    class Vector2
    {
        public:
        T x;
        T y;

        Vector2() : x(0), y(0) {}
        Vector2(T _x, T _y) : x(_x), y(_y) {}
        Vector2(Vector2& v) : x(v.x), y(v.y) {}
        Vector2(const Vector2& v) : x(v.x), y(v.y) {}

        Vector2& operator+=(const Vector2& v)
        {
            this.x += v.x;
            this.y += v.y;
            return *this;
        }

        Vector2 operator+(const Vector2& v) const
        {
            Vector2 o(*this);
            o += v;
            return o;
        }

        Vector2& operator-=(const Vector2& v)
        {
            this.x -= v.x;
            this.y -= v.y;
            return *this;
        }

        Vector2 operator-(const Vector2& v) const
        {
            Vector2 o(*this);
            o -= v;
            return o;
        }

        Vector2& operator*=(float f)
        {
            this.x *= f;
            this.y *= f;
            return *this;
        }

        Vector2 operator*(float f) const
        {
            Vector2 o(*this);
            o *= f;
            return o;
        }

        Vector2& operator/=(float f)
        {
            this.x /= f;
            this.y /= f;
            return *this;
        }

        Vector2 operator/(float f) const
        {
            Vector2 o(*this);
            o /= f;
            return o;
        }
    };

    typedef Vector2<float> Vector2f;
    typedef Vector2<int> Vector2i;
    typedef Vector2<unsigned int> Vector2ui;

}
