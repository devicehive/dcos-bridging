Pre-requisites.

1. Scriptr token.
2. Channel should be created in your scriptr account. (see documentation details https://www.scriptr.io/documentation#documentation-createchannelcreateChannel )

Open terminal window, and run the command

```export SCRIPTR_TOKEN=<your token goes here>```

Now you can access scriptr API via command line:

```wscat -c wss://api.scriptr.io/$SCRIPTR_TOKEN```

In terminal window run the command:

```{"method": "Subscribe", "params": {"channel": "chat"}}```

that will subscribe your current session to the channel. Next command will be hanled by bridge, and you'll see messages from streamed device:

```{"method": "Publish", "params": {"channel": "chat", "message": "Subscribe"}}```

To get current statistics you can run the command:

```{"method": "Publish", "params": {"channel": "chat", "message": "Stats"}}```

To stop message flow run unscubscribe command:

```{"method": "Publish", "params": {"channel": "chat", "message": "Unsubscribe"}}```
