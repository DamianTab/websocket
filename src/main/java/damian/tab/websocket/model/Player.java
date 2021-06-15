package damian.tab.websocket.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

@AllArgsConstructor
@RequiredArgsConstructor
@Data
public class Player {
    private short x;
    private short y;
    private short score;
    private final String nick;
    private final WebSocketSession session;
}
