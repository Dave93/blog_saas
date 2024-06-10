"use client";
import {
  Avatar,
  Button,
  Divider,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@nextui-org/react";
import Link from "next/link";
import { useState } from "react";

type CommentProps = {
  onOpen: () => void;
};

const Comment: React.FC<CommentProps> = ({ onOpen }) => (
  <div className="flex py-4">
    <div className="pr-4">
      <Avatar
        src="https://i.pravatar.cc/150?u=a04258114e29026302d"
        size="lg"
        className="mt-4"
      />
    </div>
    <div className="border-l-2 border-default-500 pl-4 flex-1">
      <div>
        <h2>John Doe</h2>
        <div className="text-xs text-default-500 py-1">
          June 07, 2024 at 12:00 PM
        </div>
      </div>
      <p>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptatem
        laudantium, fuga dolores nulla totam quod reiciendis veniam. Sint sunt
        non tempore vel distinctio dolorum nulla quia, nihil consequatur
        aspernatur qui.
      </p>
    </div>
    <Button className="mt-auto" size="sm" onPress={onOpen}>
      Remove
    </Button>
  </div>
);

type PageProps = {
  params: { id: string };
};
export default function Page({ params }: PageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  console.log(comment);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/blog">Back to blog</Link>
      <h4 className="font-bold text-large mt-4">Frontend Radio {params.id}</h4>
      <Image
        alt="Card background"
        className="object-cover rounded-xl py-8"
        src="https://nextui.org/images/hero-card-complete.jpeg"
      />
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati
        eveniet veritatis labore accusamus in, eos laborum ullam iure sequi
        facere adipisci nihil quia dolores atque sint sed. Placeat, aut porro.
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus
        expedita reprehenderit iusto? Nemo facilis suscipit architecto
        consequatur autem voluptatem fugit alias porro facere totam fugiat, sed
        est amet esse doloremque?
      </p>
      <Divider className="my-4" orientation="horizontal" />
      <div>5 Comments</div>
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <Comment key={i} onOpen={handleOpen} />
        ))}
      <div className="my-4">
        <Textarea
          label="Comment"
          placeholder="Write a comment..."
          onChange={(e) => setComment(e.target.value)}
          size="lg"
        />
      </div>
      <div className="flex justify-end">
        <Button>Add Comment</Button>
      </div>
      <Modal isOpen={isOpen} onOpenChange={handleClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirm Removal
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to remove this comment? This action
                  cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose(); /* Add remove logic here */
                  }}
                >
                  Confirm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
