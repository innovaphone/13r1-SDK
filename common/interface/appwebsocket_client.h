
/*---------------------------------------------------------------------------*/
/* appwebsocket_client.h                                                     */
/* copyright (c) innovaphone 2018                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

class IAppWebsocketClient {
public:
    static IAppWebsocketClient * Create(class IIoMux * const iomux,
                                        class UAppWebsocketClient * const user,
                                        class ISocketProvider * const tcpSocketProvider,
                                        class ISocketProvider * const tlsSocketProvider,
                                        class IDns * const dns,
                                        class IInstanceLog * const log);

    virtual ~IAppWebsocketClient() {};

    virtual void Connect(const char * websocketUri, const char * password, const char * app, const char * domain, const char * sip, const char * guid, const char * dn) = 0;
    virtual void MessageComplete() = 0;
    virtual void MessageSend(class json_io & msg, char * buffer) = 0;
    virtual void MessageSendText(const char * buffer) = 0;
    virtual void Close() = 0;
};

class UAppWebsocketClient {
public:
    virtual void AppWebsocketClientConnectComplete(class AppWebsocketClient * appWebsocketClient) = 0;
    virtual void AppWebsocketClientMessage(class AppWebsocketClient * appWebsocketClient, class json_io & msg, word base, const char * mt, const char * src) = 0;
    virtual void AppWebsocketClientSendResult(class AppWebsocketClient * appWebsocketClient) = 0;
    virtual void AppWebsocketClientClosed(class AppWebsocketClient * appWebsocketClient) = 0;
};
