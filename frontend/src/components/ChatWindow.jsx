import dayjs from "dayjs";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)$/i;

const MessageBody = ({ content }) => {
  if (IMAGE_EXT.test(content)) {
    return (
      <a href={content} target="_blank" rel="noreferrer">
        <img
          src={content}
          alt="attachment"
          className="msg-img"
          loading="lazy"
        />
      </a>
    );
  }

  if (VIDEO_EXT.test(content)) {
    return (
      <video controls className="msg-video" preload="metadata">
        <source src={content} />
        <track kind="captions" />
      </video>
    );
  }

  if (content.startsWith("/uploads/") || content.startsWith("http")) {
    return (
      <a href={content} target="_blank" rel="noreferrer" className="msg-file">
        {content.split("/").pop()}
      </a>
    );
  }

  return <p>{content}</p>;
};

export const ChatWindow = ({ messages, typingUsers, currentChannelName, currentUserId }) => {
  return (
    <section className="chat-window">
      <header>
        <h3>#{currentChannelName || "select-channel"}</h3>
      </header>

      <div className="message-list">
        {messages.map((message) => (
          <article className="message" key={message.id}>
            <div className="avatar">{(message.author?.username || "U").slice(0, 1)}</div>
            <div className="body">
              <div className="meta">
                <strong>{message.author?.username || "Unknown"}</strong>
                <span>{dayjs(message.createdAt).format("HH:mm")}</span>
                {message.authorId === currentUserId && message.isEdited && <em>edited</em>}
              </div>
              <MessageBody content={message.content} />
            </div>
          </article>
        ))}
      </div>

      <div className="typing-strip">
        {Object.entries(typingUsers)
          .filter(([, typing]) => typing)
          .map(([id]) => (
            <span key={id}>User {id.slice(0, 4)} is typing...</span>
          ))}
      </div>
    </section>
  );
};
