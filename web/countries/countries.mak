
WEBSRC += \
	web/countries/innovaphone.countries.js

$(OUTDIR)/obj/countries_httpdata.cpp: $(IP_SRC)/web/countries/countries.mak $(IP_SRC)/web/countries/*.js 
		$(IP_SRC)/exe/httpfiles $(HTTPFILES-FLAGS) -d $(IP_SRC) -o $(OUTDIR)/obj/countries_httpdata.cpp \
		web/countries/innovaphone.countries.js,SERVLET_STATIC,HTTP_CACHE+HTTP_NOPWD+HTTP_FORCENOPWD 

COMMONOBJS += $(OUTDIR)/obj/countries_httpdata.o
$(OUTDIR)/obj/countries_httpdata.o: $(OUTDIR)/obj/countries_httpdata.cpp
