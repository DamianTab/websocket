package damian.tab.websocket.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class BinaryWebSocket extends BinaryWebSocketHandler {

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        String s = StandardCharsets.UTF_8.decode(message.getPayload()).toString();
        log.info(s);

        try {
            session.sendMessage(new BinaryMessage("hello world".getBytes()));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
