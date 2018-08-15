
WEBSRC += \
	web/countries/innovaphone.config.js

$(OUTDIR)/obj/config_httpdata.cpp: $(IP_SRC)/web/config/config.mak $(IP_SRC)/web/config/*.js 
		$(IP_SRC)/exe/httpfiles $(HTTPFILES-FLAGS) -d $(IP_SRC) -o $(OUTDIR)/obj/config_httpdata.cpp \
		web/config/innovaphone.config.js,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD 

COMMONOBJS += $(OUTDIR)/obj/config_httpdata.o
$(OUTDIR)/obj/config_httpdata.o: $(OUTDIR)/obj/config_httpdata.cpp
