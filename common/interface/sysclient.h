/*---------------------------------------------------------------------------*/
/* sysclient.h                                                                */
/* copyright (c) innovaphone 2018                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

class ISysclient {
public:
    static class ISysclient * Create(class IIoMux * const iomux, class ISocketProvider * tcpSocketProvider, class ISocketProvider * tlsSocketProvider, class USysclient * uSysclient, const char * serverURI, class IInstanceLog * const log, const char * webserverPassword, const char * provisioningCode, const char * macAddress);
    virtual ~ISysclient() {};
    //virtual void GetHostByName(const char * host, class USysclient * const user, class IInstanceLog * const log, bool all = false) = 0;
    virtual void SendIdentify(const char * challenge, const char * provisioningCode, const char * mac, const char * product, const char * version, const char * type) = 0;
    virtual void SendCustomIdentify(const void * buff, size_t len) = 0;
    virtual void Close() = 0;
};

class USysclient {
public:
    virtual void SysclientConnected(class ISysclient * sysclient) = 0;
    virtual void SetProvisioningCode(const char * provisioningCode) = 0;
    virtual void SetManagerSysClientPassword(const char * password) = 0;
    virtual void SetPasswords(const char * admin_pwd) = 0;
    virtual const char * GetManagerSysClientPassword() = 0;
    virtual void SysClientClosed(class ISysclient * sysclient) = 0;
};
