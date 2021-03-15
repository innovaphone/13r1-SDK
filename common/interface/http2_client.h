
/*---------------------------------------------------------------------------*/
/* http2_client.h                                                            */
/* copyright (c) innovaphone 2020                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/


namespace HTTP2
{
    enum class Version
    {
        HTTP1_0,
        HTTP1_1,
        HTTP2
    };
    
    enum class Scheme
    {
        HTTP,
        HTTPS
    };

    enum class Method
    {
        GET,       // Transfer a current representation of the target resource.
        HEAD,      // Same as GET, but only transfer the status line and header section.
        POST,      // Perform resource - specific processing on the request payload.
        PUT,       // (WebDAV) Replace all current representations of the target resource with the request payload.
        CONNECT,   // Establish a tunnel to the server identified by the target resource.
        OPTIONS,   // (WebDAV) Describe the communication options for the target resource.
        TRACE,     // (WebDAV) Perform a message loop - back test along the path to the target resource.
        PROPFIND,  // (WebDAV) Used to revceive properties for the given resource.
        MKCOL,     // (WebDAV) Creates a new collection at the specified location.
        COPY,      // (WebDAV) Copy the given resource to a specificed location.
        MOVE,      // (WebDAV) Moves the given resource to a specified location.
        DELETE,    // (WebDAV) Deletes the given resource.
        LOCK,      // (WebDAV) Locks the given resource.
        UNLOCK,    // (WebDAV) Unlocks the previously locked resource
        PROPPATCH  // (WebDAV) Patches the properties of the given resource
        //SYSCLIENT  // Sysclient request to authenticate localsocket requests
    };

    enum class ShutdownReason
    {
        SHUTDOWN_NORMAL,
        SOCKET_LOST,
        SERVER_CLOSED_CONNECTION,
        ADDRESS_INVALID,
        SOCKET_ERROR,
        CONNECT_FAILED,
        BYTE_STREAM_BROKEN,
        PROTOCOL_ERROR,
        UNHANDLED_HTTP_RESULT,
        FAILURE,
        AUTHENTICATION_FAILED,
        NOT_FOUND,
        BAD_REQUEST,
        INTERNAL_SERVER_ERROR,
        CONNECTION_REFUSED
    };

    enum class HeaderFieldIndexing
    {
        NORMAL,     // Literal Header Field with Incremental Indexing
        WITHOUT,    // Literal Header Field without Indexing
        NEVER       // Literal Header Field Never Indexed
    };

    static constexpr dword HTTP_REQUEST_FAILED = 0xFFFFFFFF;
    static constexpr ulong64 CONTENT_CHUNK_ENCODED = 0xFFFFFFFFFFFFFFFF; // Use as parameter for IHTTP2Request::ConentnLength() to enabled chunk encoded transfer.
} // namespace HTTP2


inline const char * HTTP2MethodToStr(HTTP2::Method method)
{
    const char * result = "";
    
    switch (method) {
    case HTTP2::Method::GET: result = "GET"; break;
    case HTTP2::Method::HEAD: result = "HEAD"; break;
    case HTTP2::Method::POST: result = "POST"; break;
    case HTTP2::Method::PUT: result = "PUT"; break;
    case HTTP2::Method::CONNECT: result = "CONNECT"; break;
    case HTTP2::Method::OPTIONS: result = "OPTIONS"; break;
    case HTTP2::Method::TRACE: result = "TRACE"; break;
    case HTTP2::Method::PROPFIND: result = "PROPFIND"; break;
    case HTTP2::Method::MKCOL: result = "MKCOL"; break;
    case HTTP2::Method::COPY: result = "COPY"; break;
    case HTTP2::Method::MOVE: result = "MOVE"; break;
    case HTTP2::Method::DELETE: result = "DELETE"; break;
    case HTTP2::Method::LOCK: result = "LOCK"; break;
    case HTTP2::Method::UNLOCK: result = "UNLOCK"; break;
    case HTTP2::Method::PROPPATCH: result = "PROPPATCH"; break;
        // case HTTP2::Method::SYSCLIENT: return "SYSCLIENT";  // Sysclient request to authenticate localsocket requests
    }
    return result;
}

inline const char * HTTP2ShutdownReasonToStr(HTTP2::ShutdownReason reason)
{
    const char * result = "<unkown reason id>";
    switch (reason) {
    case HTTP2::ShutdownReason::SHUTDOWN_NORMAL: result = "SHUTDOWN_NORMAL"; break;
    case HTTP2::ShutdownReason::SOCKET_LOST: result = "SOCKET_LOST"; break;
    case HTTP2::ShutdownReason::SERVER_CLOSED_CONNECTION: result = "SERVER_CLOSED_CONNECTION"; break;
    case HTTP2::ShutdownReason::ADDRESS_INVALID: result = "ADDRESS_INVALID"; break;
    case HTTP2::ShutdownReason::SOCKET_ERROR: result = "SOCKET_ERROR"; break;
    case HTTP2::ShutdownReason::CONNECT_FAILED: result = "CONNECT_FAILED"; break;
    case HTTP2::ShutdownReason::BYTE_STREAM_BROKEN: result = "BYTE_STREAM_BROKEN"; break;
    case HTTP2::ShutdownReason::PROTOCOL_ERROR: result = "PROTOCOL_ERROR"; break;
    case HTTP2::ShutdownReason::UNHANDLED_HTTP_RESULT: result = "UNHANDLED_HTTP_RESULT"; break;
    case HTTP2::ShutdownReason::FAILURE: result = "FAILURE"; break;
    case HTTP2::ShutdownReason::AUTHENTICATION_FAILED: result = "AUTHENTICATION_FAILED"; break;
    case HTTP2::ShutdownReason::NOT_FOUND: result = "NOT_FOUND"; break;
    case HTTP2::ShutdownReason::BAD_REQUEST: result = "BAD_REQUEST"; break;
    case HTTP2::ShutdownReason::INTERNAL_SERVER_ERROR: result = "INTERNAL_SERVER_ERROR"; break;
    case HTTP2::ShutdownReason::CONNECTION_REFUSED: result = "CONNECTION_REFUSED"; break;
    }
    return result;
}

class IHTTPHeader
{
public:
    IHTTPHeader() {}
    virtual ~IHTTPHeader() {}

    virtual HTTP2::Version Version() = 0;

    virtual HTTP2::Scheme Scheme() = 0;
    virtual HTTP2::Method Method() = 0;
    virtual const char * Resource() = 0;
    virtual const char * Authority() = 0; // Only relevant for HTTP/2
    virtual int Status() = 0; // HTTP status as number. Use HTTPLib::http_result_t for getting a description, too. Only makes sense for response header.

    virtual void ContentLength(ulong64 cl, HTTP2::HeaderFieldIndexing indexing = HTTP2::HeaderFieldIndexing::NORMAL) = 0;
    virtual ulong64 ContentLength() = 0;

    virtual void ResourceIndexing(HTTP2::HeaderFieldIndexing indexing) = 0;
    virtual HTTP2::HeaderFieldIndexing ResourceIndexing() = 0;

    virtual void SetHeaderField(const char * fieldName, ulong64 fieldValue, HTTP2::HeaderFieldIndexing indexing = HTTP2::HeaderFieldIndexing::NORMAL) = 0;
    virtual void SetHeaderField(const char * fieldName, const char * fieldValue, HTTP2::HeaderFieldIndexing indexing = HTTP2::HeaderFieldIndexing::NORMAL) = 0;

    virtual size_t HeaderFieldValueCount(const char * fieldName) = 0;
    virtual const char * HeaderFieldValue(const char * fieldName, dword index) = 0;

    virtual void CopyHeaderField(const char * fieldName, IHTTPHeader * fromHeader) = 0;

    virtual void SetChunkEncoded() = 0;
    virtual bool ChunkEncoded() = 0;
};


class IHTTP2Request
{
protected:
    virtual ~IHTTP2Request() {}

public:
    IHTTP2Request() {}

    virtual void Send(byte * buffer, size_t size, bool lastPart = false) = 0;
    virtual void Recv(byte * buffer, size_t size) = 0;
    virtual void Shutdown(HTTP2::ShutdownReason reason) = 0;
    virtual bool Completed() = 0;

    virtual IHTTPHeader * RequestHeader() = 0;
    virtual IHTTPHeader * ResponseHeader() = 0;

    virtual class IHTTP2Client * HTTP2Client() = 0;
};


class UHTTP2RequestUser
{
public:
    UHTTP2RequestUser() {}
    virtual ~UHTTP2RequestUser() {}

    virtual void HTTP2RequestStart(class IHTTP2Request * request) = 0; // Place to set additional, request related
    virtual void HTTP2RequestReadyToSend(class IHTTP2Request * request) = 0;
    virtual void HTTP2RequestSendResult(class IHTTP2Request * request) = 0;

    virtual void HTTP2RequestReadyToRecv(class IHTTP2Request * request, ulong64 contentLength) = 0; // contentLength = CONTENT_CHUNK_ENCODED if response has chunk encoded data.
    virtual void HTTP2RequestRecvResult(class IHTTP2Request * request, byte * buffer, size_t recvLen, bool transferComplete) = 0;
    virtual void HTTP2RequestRecvCanceled(class IHTTP2Request * request, byte * buffer) {}
    virtual void HTTP2RequestShutdownComplete(class IHTTP2Request * request, HTTP2::ShutdownReason reason) = 0;
};


class UHTTP2Client
{
public:
    UHTTP2Client() {}
    virtual ~UHTTP2Client() {}
    
    virtual void HTTP2ClientConnectComplete(class IHTTP2Client * http2Client) {}
    virtual void HTTP2ClientAllRequestsCompleted(class IHTTP2Client * http2Client) {}
    virtual void HTTP2ClientShutdownComplete(class IHTTP2Client * http2Client, HTTP2::ShutdownReason reason) = 0;
};


class IHTTP2Client {
public:
    static IHTTP2Client * Create(class IIoMux * const iomux,
                                 class ISocketProvider * const tcpSocketProvider,
                                 class ISocketProvider * const tlsSocketProvider,
                                 class UHTTP2Client * user,
                                 class IDns * const dns,
                                 class IInstanceLog * const log,
                                 class ISocketContext * const socketContext = nullptr);
    
    IHTTP2Client() {}
    virtual ~IHTTP2Client() {}
    
    virtual void Connect(const char * uri) = 0;
    virtual void Reconnnect(const char * uri) = 0;
    virtual void SetUser(class UHTTP2Client * user) = 0;

    virtual dword Request(UHTTP2RequestUser * user, HTTP2::Method method, const char * resource, ulong64 parentID = 0) = 0;

    virtual void Shutdown() = 0;
    virtual bool IsHTTP2Connection() = 0;
    virtual bool Connected() = 0;

    static const char** ALPNProtocolList();
};
