import styles from './Carousel.module.css';

export default ({ ticket }) => {
    return (
        <div className="card-body">
            <div id="ticket-carousel" className="carousel slide mt-4" data-ride="carousel">
                <div className="carousel-inner">
                    {ticket.images.map((image, index) => (
                        <div className={`${styles.carouselItem} ${index === 0 ? 'active' : ''}`} key={image}>
                            <img src={`/uploads/${image}`} className="d-block w-100" alt={`Ticket Image ${index + 1}`} />
                        </div>
                    ))}
                </div>
                <a className="carousel-control-prev" href="#ticket-carousel" role="button" data-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="sr-only">Previous</span>
                </a>
                <a className="carousel-control-next" href="#ticket-carousel" role="button" data-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="sr-only">Next</span>
                </a>
            </div>
        </div>
    );
}
