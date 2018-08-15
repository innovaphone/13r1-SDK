/*---------------------------------------------------------------------------*/
/* callback.h                                                                */
/* copyright (c) innovaphone 2018                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

class UCallback {
public:
    virtual void Callback(class ICallback * source) {};
};

class ICallback {
public:
    virtual ~ICallback() {};
};
