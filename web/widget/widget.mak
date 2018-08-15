
WEBSRC += \
	web/widget/innovaphone.widget.arrow.svg \
	web/widget/innovaphone.widget.BusinessCards.css \
	web/widget/innovaphone.widget.BusinessCards.js \
	web/widget/innovaphone.widget.Conference.js \
	web/widget/innovaphone.widget.general.css \
	web/widget/innovaphone.widget.keypad.svg \
	web/widget/innovaphone.widget.mail.svg \
	web/widget/innovaphone.widget.mute.svg \
	web/widget/innovaphone.widget.phone.svg \
	web/widget/innovaphone.widget.SideBar.css \
	web/widget/innovaphone.widget.SideBar.js \
	web/widget/innovaphone.widget.video.svg

$(OUTDIR)/obj/widget_httpdata.cpp: $(IP_SRC)/web/widget/widget.mak $(IP_SRC)/web/widget/*.js $(IP_SRC)/web/widget/*.css $(IP_SRC)/web/widget/*.svg
		$(IP_SRC)/exe/httpfiles $(HTTPFILES-FLAGS) -d $(IP_SRC) -o $(OUTDIR)/obj/widget_httpdata.cpp \
		web/widget/innovaphone.widget.arrow.svg,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.BusinessCards.css,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.BusinessCards.js,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.Conference.js,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.general.css,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.keypad.svg,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.mail.svg,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.mute.svg,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.phone.svg,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.SideBar.css,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.SideBar.js,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD \
		web/widget/innovaphone.widget.video.svg,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD

COMMONOBJS += $(OUTDIR)/obj/widget_httpdata.o
$(OUTDIR)/obj/widget_httpdata.o: $(OUTDIR)/obj/widget_httpdata.cpp
