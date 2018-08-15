
/*---------------------------------------------------------------------------*/
/* apiwebsocket_client.h                                                     */
/* copyright (c) innovaphone 2017                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

class ApiWebsocketClient : public UWebsocketClient, public UTimer {
    friend class ApiProvider;
    friend class ApiConsumer;
    void WebsocketConnectComplete(IWebsocketClient * const websocket) override;
    void WebsocketCloseComplete(IWebsocketClient * const websocket, closereason_t reason) override;
    void WebsocketSendResult(IWebsocketClient * const websocket) override;
    void WebsocketRecvResult(IWebsocketClient * const websocket, void * buf, size_t len, bool text, bool isFragment) override;
    void * WebsocketRecvBuffer(size_t len) override;
    void WebsocketRecvCanceled(IWebsocketClient * const websocket, void * buf) override;
    void TimerOnTimeout(ITimer * timer) override;

    void TryClose();
    void ApiProviderClosed(class ApiProvider * provider);
    void ApiConsumerClosed(class ApiConsumer * consumer);

    bool up;
    bool closing;
    class IIoMux * iomux;
    class ISocketProvider * tcp;
    class ISocketProvider * tls;
    class IDns * dns;
    class IWebsocketClient * websocket;
    class IInstanceLog * log;
    class ITimer * timer;
    dword timeoutTime;
    class btree * providers;
    class btree * consumers;
    char * name;
    char * uri;
    char * dn;
    char * pwd;

public:
    ApiWebsocketClient(class IIoMux * const iomux, class ISocketProvider * const tcp, class ISocketProvider * const tls, class IDns * const dns, class IInstanceLog * const log, const char * uri, const char * pwd, const char * dn);
    virtual ~ApiWebsocketClient();

    bool ApiWebsocketClientIsConnected();
    void ApiWebsocketClientClose();

    virtual void ApiWebsocketClientCloseComplete() = 0;
    virtual void ApiWebsocketClientConnected() {};
    virtual void ApiWebsocketClientDisconnected() {};
};

class ApiProvider : public btree, public UIoExec {
    friend class ApiWebsocketClient;

    int btree_compare(void * key) override;
    int btree_compare(class btree * b) override;
    void IoExec(void * execContext) override;

    class ApiWebsocketClient * client;

protected:
    virtual ~ApiProvider();
    void ApiProviderClosed();
    void SendRegisterApi();
    void SendApiModel();

    char * api;
    char * model;

public:
    ApiProvider(class ApiWebsocketClient * const client, const char * api);

    void ApiProviderSend(const char * client, const char * consumer, const char * src, class json_io & msg, word base, char * buffer);
    void ApiProviderUpdate(class json_io & json, word base, char * buffer);

    virtual void ApiProviderRecv(const char * client, const char * consumer, const char * src, class json_io & msg, word base) = 0;
    virtual void ApiProviderConsumerClosed(const char * client, const char * consumer) {}
    virtual void ApiProviderClose() { ApiProviderClosed(); }
    virtual void ApiProviderConnected() {}
    virtual void ApiProviderDisconnected() {}
};

class ApiConsumer : public btree, public UIoExec {
    friend class ApiWebsocketClient;

    int btree_compare(void * key) override;
    int btree_compare(class btree * b) override;
    void IoExec(void * execContext) override;

    class ApiWebsocketClient * client;

protected:
    virtual ~ApiConsumer();
    void ApiConsumerClosed();
    void SendConsumeApi();

    char * api;

public:
    ApiConsumer(class ApiWebsocketClient * const client, const char * api);

    void ApiConsumerSend(const char * provider, const char * src, class json_io & msg, word base, char * buffer);

    virtual void ApiConsumerRecv(const char * provider, const char * src, class json_io & msg, word base) {};
    virtual void ApiConsumerUpdate(class json_io & model, word base) {};
    virtual void ApiConsumerClose() { ApiConsumerClosed(); }
    virtual void ApiConsumerConnected() {}
    virtual void ApiConsumerDisconnected() {}
};
