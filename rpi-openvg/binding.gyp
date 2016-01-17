{
  "targets": [
    {
      "target_name": "openvg",
      "sources": [ "openvg.cpp", "font.cpp", "graphics.cpp", "vgft.cpp", "window.cpp", "image.cpp" ],
      "include_dirs": [
        "/opt/vc/include/", "/opt/vc/include/interface/vcos/pthreads", "/opt/vc/include/interface/vmcs_host/linux",
        "/usr/include/freetype2", "./"
      ],
      "libraries": [
        "-L/opt/vc/lib", "-lEGL", "-lGLESv2", "-lbcm_host", "-lvcos", 
        "-lvchiq_arm", "-lpthread", "-lrt", "-lm", "-lfreetype", "-lz"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags": ["-fpermissive", "-std=c++1y", "-DSTANDALONE", "-D__STDC_CONSTANT_MACROS",
        "-D__STDC_LIMIT_MACROS", "-DTARGET_POSIX", "-D_LINUX", "-fPIC", "-DPIC", 
        "-D_REENTRANT", "-D_LARGEFILE64_SOURCE", "-D_FILE_OFFSET_BITS=64", "-U_FORTIFY_SOURCE",
        "-Wall", "-g", "-DHAVE_LIBOPENMAX=2", "-DOMX", "-DOMX_SKIP64BIT", "-ftree-vectorize", "-pipe",
        "-DUSE_EXTERNAL_OMX", "-DHAVE_LIBBCM_HOST", "-DUSE_EXTERNAL_LIBBCM_HOST", "-DUSE_VCHIQ_ARM", "-Wno-psabi" ],
      "cflags_cc!": [ "-fno-exceptions" ]
    }
  ]
}
