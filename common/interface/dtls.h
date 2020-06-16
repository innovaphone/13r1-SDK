/*---------------------------------------------------------------------------*/
/* dtls.h                                                                    */
/* copyright (c) innovaphone 2017                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

enum dtlsOptions {
    DTLS_OPTION_NO_COOKIE = 1,
    DTLS_OPTION_NO_MUTUAL = 2,
    DTLS_OPTION_USE_SRTP = 4
};

class UDtls {
public:
    virtual void DtlsInitialized(void * ctx, const byte * fingerprint, size_t fingerprintLen) = 0;
    virtual void DtlsConnected(void * ctx) = 0;
    virtual void DtlsTimerStart(void * ctx, int to) = 0;
    virtual void DtlsTimerStop(void * ctx) = 0;
    virtual void DtlsConnectionClosed(void * ctx, int error) = 0;
    virtual void DtlsSend(void * ctx, char * buf, int len) = 0;
    virtual void DtlsRecvApplicationData(void * ctx, char * buf, int len) = 0;
    virtual void DtlsSrtpKeys(void* ctx, byte * keys, const char * profile) = 0;

    bool dtlsDisabled;
};

class IDtls {
public:
    static class IDtls * Create(class UDtls * user, void * userCtx, IInstanceLog * const log);

    virtual ~IDtls() {};
    virtual void DtlsInitialize(const byte * certificateFingerprint, size_t certificateFingerprintLen) = 0;
    virtual void DtlsConnect(bool server, int options, const char * remoteAddress, class ISocketContext * context, byte * fingerprint, byte fingerprintLen, bool paused) = 0;
    virtual void DtlsUnpause() = 0;
    virtual void DtlsTimeout() = 0;
    virtual void DtlsClose() = 0;
    virtual void DtlsSendApplicationData(char * buf, int len) = 0;
    virtual bool DtlsRecv(char * buf, int len, IPaddr remoteAddr, word remotePort) = 0;
    virtual void DtlsAbortConnect() = 0;
};