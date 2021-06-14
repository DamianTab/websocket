package damian.tab.websocket.websocket;

import damian.tab.websocket.model.Game;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class BinaryWebSocket extends BinaryWebSocketHandler {

    private Map<String, Game> games = new HashMap<>();

//    todo generowac liste cells i propagowac do klientow
//    todo sprawdzanie czy zajal cell przy ruchu klienta
    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        String s = StandardCharsets.UTF_8.decode(message.getPayload()).toString();
        log.info(s);
        Map<String, String> params = extractClientCredentials(session.getUri().getQuery());
        log.info(String.valueOf(params));


        try {
            session.sendMessage(new BinaryMessage("hello world".getBytes()));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private Map<String, String> extractClientCredentials(String queryParams) {
        Map<String, String> result = new HashMap<>();
        String[] params = queryParams.split("&");
        for (int i = 0; i < 2; i++) {
            String[] keyValue = params[i].split("=");
            result.put(keyValue[0].trim(), keyValue[1].trim());
        }
        return result;
    }

}
