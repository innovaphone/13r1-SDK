
WEBSRC += \
	web/ui1.switch/innovaphone.ui1.switch.js

$(OUTDIR)/obj/ui1.switch_httpdata.cpp: $(IP_SRC)/web/ui1.switch/ui1.switch.mak $(IP_SRC)/web/ui1.switch/*.js
		$(IP_SRC)/exe/httpfiles $(HTTPFILES-FLAGS) -d $(IP_SRC) -o $(OUTDIR)/obj/ui1.switch_httpdata.cpp \
		web/ui1.switch/innovaphone.ui1.switch.js,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD

COMMONOBJS += $(OUTDIR)/obj/ui1.switch_httpdata.o
$(OUTDIR)/obj/ui1.switch_httpdata.o: $(OUTDIR)/obj/ui1.switch_httpdata.cpp
