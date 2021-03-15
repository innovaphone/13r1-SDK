/*---------------------------------------------------------------------------*/
/* socket.h                                                                  */
/* copyright (c) innovaphone 2015                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

typedef enum {
    SOCKET_SHUTDOWN_NORMAL,
    SOCKET_SHUTDOWN_BY_PEER,
    SOCKET_LOST,
    SOCKET_ADDRESS_INVALID,
    SOCKET_OPEN_FAILED,
    SOCKET_CONNECT_FAILED,
    SOCKET_CONNECT_REJECTED,
    SOCKET_BIND_FAILED,
    SOCKET_LISTEN_FAILED,
    SOCKET_ACCEPT_FAILED,
    SOCKET_TLS_HANDSHAKE_FAILED,
    SOCKET_ADDR_IN_USE,
    SOCKET_ALPN_SELECTION_FAILED
} shutdownreason_t;


inline const char * SocketShutdownReasonToStr(shutdownreason_t r)
{
    switch (r)
    {
    case SOCKET_SHUTDOWN_NORMAL: return "SOCKET_SHUTDOWN_NORMAL";
    case SOCKET_SHUTDOWN_BY_PEER: return "SOCKET_SHUTDOWN_BY_PEER";
    case SOCKET_LOST: return "SOCKET_LOST";
    case SOCKET_ADDRESS_INVALID: return "SOCKET_ADDRESS_INVALID";
    case SOCKET_OPEN_FAILED: return "SOCKET_OPEN_FAILED";
    case SOCKET_CONNECT_FAILED: return "SOCKET_CONNECT_FAILED";
    case SOCKET_CONNECT_REJECTED: return "SOCKET_CONNECT_REJECTED";
    case SOCKET_BIND_FAILED: return "SOCKET_BIND_FAILED";
    case SOCKET_LISTEN_FAILED: return "SOCKET_LISTEN_FAILED";
    case SOCKET_ACCEPT_FAILED: return "SOCKET_ACCEPT_FAILED";
    case SOCKET_TLS_HANDSHAKE_FAILED: return "SOCKET_TLS_HANDSHAKE_FAILED";
    case SOCKET_ADDR_IN_USE: return "SOCKET_ADDR_IN_USE";
    case SOCKET_ALPN_SELECTION_FAILED: return "SOCKET_ALPN_SELECTION_FAILED";
    }
    
    return "<unkown>"; // Make compiler happpy...
}


typedef enum {
    QOS_BEST_EFFORT,
    QOS_AUDIO_VIDEO,
    QOS_VOICE,
} qostraffictype_t;

class ISocket {
public:
    virtual ~ISocket() {};
    virtual void Connect(const char * address, const char * serverName = NULL) = 0;
    virtual void Bind(const char * localAddr = NULL, word localPort = 0) = 0;
    virtual void Bind(const char * localAddr, word localPort, bool reuseAddr) {};
    virtual void GetLocalAddress(char * localAddr, unsigned size, word * localPort) {};
    virtual void Listen() = 0;
    virtual void Accept(class USocket * remoteUser) = 0;
    virtual void Shutdown() = 0;
    virtual void Send(const void * buf, size_t len) = 0;
    virtual void SendTo(const void * buf, size_t len, IPaddr dstAddr, word dstPort) {};
    virtual void Recv(void * buf, size_t len, bool recvPartial = false) = 0;
    virtual void SetQoS(qostraffictype_t type) {};
    virtual void SetUser(class USocket * const user) = 0;
};


class USocket {
public:
    virtual void SocketConnectComplete(ISocket * const socket) {};
    virtual void SocketBindResult(ISocket * const socket, const char * localAddr, word localPort) {};
    virtual void SocketListenResult(ISocket * const socket, const char * remoteAddr, word remotePort) {};
    virtual void SocketAcceptComplete(ISocket * const socket) {};
    virtual void SocketShutdown(ISocket * const socket, shutdownreason_t reason) = 0;
    virtual void SocketSendResult(ISocket * const socket) {};
    virtual void SocketRecvResult(ISocket * const socket, void * buf, size_t len) {};
    virtual void SocketRecvFromResult(ISocket * const socket, void * buf, size_t len, IPaddr dstAddr, word dstPort) {};
    virtual void SocketRecvCanceled(ISocket * const socket, void * buf) = 0;
    virtual void SocketUpgradeToTLSComplete(ISocket* const socket) {};
    virtual bool SocketAcceptSelectedALPNProtocol(ISocket * const socket, const char * protocol) { return true; };
};


class ISocketContext {
public:
    virtual ~ISocketContext() {};
    virtual void EnableDTLS(bool useSrtp) {};
    virtual void SetServerCertificate(const byte * cert, size_t certLen, const char * hostName = NULL) {};
    virtual void SetClientCertificate(const byte * cert, size_t certLen, const char * hostName = NULL) {};
    virtual const byte * GetCertificateFingerprint(size_t * length) { return NULL; };
    virtual void DisableClientCertificate() {};
    virtual void SetALPNProcotols(const char * const * alpnList) {};
};

class ISocketProvider {
public:
    virtual ~ISocketProvider() {};
    virtual ISocketContext * CreateSocketContext(class IInstanceLog * const log) = 0;
    virtual ISocket * CreateSocket(class IIoMux * const iomux, USocket * const user, class IInstanceLog * const log, bool useIPv6, class ISocketContext * socketContext = nullptr) = 0;
    virtual ISocket * UpgradeToTLSSocket(class ISocket * fromTCPSocket, IIoMux * const iomux, USocket * const user, IInstanceLog * const log,
        bool initServerSide = false, class ISocketContext * socketContext = NULL) { ASSERT(false, "UpgradeToTLSSocket() only allowed for TLSSocketProviders!"); return NULL; };
};

extern "C" ISocketProvider * CreateUDPSocketProvider();
extern "C" ISocketProvider * CreateTCPSocketProvider();
extern "C" ISocketProvider * CreateTLSSocketProvider(ISocketProvider * tcpSocketProvider);
extern "C" ISocketProvider * CreateLocalSocketProvider();

