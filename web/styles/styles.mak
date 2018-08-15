
WEBSRC += \
	web/styles/innovaphone.styles.css \
	web/styles/styles.Close.png \
	web/styles/styles.Arrow.png \
	web/styles/styles.ArrowActive.png \
	web/styles/styles.Background.png \
	web/styles/styles.GlowUpsideDown2.png \
	web/styles/styles.DropDown.png \
	web/styles/styles.Loader.gif \
	web/styles/styles.GlowMiddleHover.png \
	web/styles/styles.SeparatorMiddle.png \
	web/styles/styles.Hide.png \
	web/styles/styles.Error.png \
	web/styles/styles.Confirmation.png

$(OUTDIR)/obj/styles_httpdata.cpp: $(IP_SRC)/web/styles/styles.mak $(IP_SRC)/web/styles/*.png $(IP_SRC)/web/styles/*.css
		$(IP_SRC)/exe/httpfiles $(HTTPFILES-FLAGS) -d $(IP_SRC) -o $(OUTDIR)/obj/styles_httpdata.cpp \
		web/styles/innovaphone.styles.css,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/styles/styles.Close.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/styles/styles.Arrow.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.ArrowActive.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.Background.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.GlowUpsideDown2.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.DropDown.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.Loader.gif,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.GlowMiddleHover.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.SeparatorMiddle.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.Hide.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.Error.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
        web/styles/styles.Confirmation.png,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \

COMMONOBJS += $(OUTDIR)/obj/styles_httpdata.o
$(OUTDIR)/obj/styles_httpdata.o: $(OUTDIR)/obj/styles_httpdata.cpp
