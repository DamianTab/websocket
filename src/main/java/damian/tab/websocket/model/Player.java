package damian.tab.websocket.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.web.socket.WebSocketSession;

import static damian.tab.websocket.Utils.getRandomBetween;

@AllArgsConstructor
@Data
public class Player {
    private short x;
    private short y;
    private short score;
    private final String nick;
    private final WebSocketSession session;

    public Player(String nick, WebSocketSession session) {
        this.nick = nick;
        this.session = session;
        this.x = getRandomBetween();
        this.y = getRandomBetween();
    }
}
