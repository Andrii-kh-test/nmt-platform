"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import HtmlContent from "@/app/components/common/HtmlContent";

import DropZone from "./DropZone";
import DraggableAnswer from "./DraggableAnswer";

import type {
  Question,
} from "@/app/types/question";

import type {
  MatchingLeftItem,
  MatchingRightItem,
} from "@/app/types/matching";

type Props = {
  question: Question;

  selectedAnswers: number[];

  onChange: (
    answers: number[]
  ) => void;
};

type Assignment = {
  leftId: number;
  rightId: number | null;
};

export default function Matching({
  question,
  selectedAnswers,
  onChange,
}: Props) {

  const sensors = useSensors(

    useSensor(
      PointerSensor,
      {
        activationConstraint: {
          distance: 5,
        },
      }
    )

  );

  const initialAssignments =
    useMemo(() => {

      return question.matchingLeftItems.map(

        (
          left,
          index
        ) => ({

          leftId: left.id,

          rightId:
            selectedAnswers[index] || null,

        })

      );

    }, [
      question,
      selectedAnswers,
    ]);

  const [
    assignments,
    setAssignments,
  ] = useState<Assignment[]>(
    initialAssignments
  );

  const [
    activeId,
    setActiveId,
  ] = useState<number | null>(
    null
  );

  useEffect(() => {

    setAssignments(
      initialAssignments
    );

  }, [
    initialAssignments,
  ]);

  const freeRightItems =
    question.matchingRightItems.filter(

      (right) =>

        !assignments.some(

          (assignment) =>
            assignment.rightId ===
            right.id

        )

    );

  function saveAssignments(
    updated: Assignment[]
  ) {

    setAssignments(updated);

    onChange(

      updated.map(

        (item) =>
          item.rightId ?? 0

      )

    );

  }

  function clearAssignment(
    leftId: number
  ) {

    const updated =
      assignments.map(

        (item) =>

          item.leftId === leftId

            ? {
                ...item,
                rightId: null,
              }

            : item

      );

    saveAssignments(
      updated
    );

  }

  function getRightItem(
    id: number | null
  ): MatchingRightItem | undefined {

    if (!id) return undefined;

    return question.matchingRightItems.find(

      (item) =>
        item.id === id

    );

  }

  function getLetter(
    id: number
  ) {

    const index =
      question.matchingRightItems.findIndex(

        (item) =>
          item.id === id

      );

    return String.fromCharCode(
      1040 + index
    );

  }
    function handleDragStart(
    event: any
  ) {

    setActiveId(
      Number(event.active.id)
    );

  }

  function handleDragEnd(
    event: DragEndEvent
  ) {

    setActiveId(null);

    const { active, over } = event;

    if (!over) return;

    const rightId =
      Number(active.id);

    const leftId =
      Number(over.id);

    const updated =
      assignments.map(

        (item) => {

          // якщо ця відповідь вже була
          // прикріплена до іншого пункту —
          // відкріплюємо її

          if (
            item.rightId === rightId
          ) {

            return {

              ...item,

              rightId: null,

            };

          }

          return item;

        }

      );

    const finalAssignments =
      updated.map(

        (item) =>

          item.leftId === leftId

            ? {

                ...item,

                rightId,

              }

            : item

      );

    saveAssignments(
      finalAssignments
    );

  }

  return (

    <DndContext

      sensors={sensors}

      onDragStart={
        handleDragStart
      }

      onDragEnd={
        handleDragEnd
      }

    >

      <div className="space-y-8">


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Ліва колонка */}

          <div className="space-y-6">

            {question.matchingLeftItems.map(

              (
                left,
                index
              ) => {

                const assignment =
                  assignments.find(

                    (item) =>
                      item.leftId ===
                      left.id

                  );

                const right =
                  getRightItem(
                    assignment?.rightId ??
                      null
                  );

                return (

                  <div
                    key={left.id}
                    className="space-y-3"
                  >

                    <div className="flex gap-3">

                      <div className="font-bold">

                        {index + 1}.

                      </div>

                      <HtmlContent

                        html={left.text}

                        className="flex-1"

                      />

                    </div>

                    <DropZone

                      id={left.id}

                      letter={
                        right
                          ? getLetter(
                              right.id
                            )
                          : undefined
                      }

                      text={
                        right?.text
                      }

                      onClear={() =>
                        clearAssignment(
                          left.id
                        )
                      }

                    />

                  </div>

                );

              }

            )}

          </div>
                    {/* Права колонка */}

          <div className="space-y-4">

            {freeRightItems.map((item) => (

              <DraggableAnswer

                key={item.id}

                id={item.id}

                letter={getLetter(item.id)}

                text={item.text}

              />

            ))}

          </div>

        </div>

      </div>

      <DragOverlay>

        {activeId ? (

          (() => {

            const item =
              question.matchingRightItems.find(

                (option) =>
                  option.id === activeId

              );

            if (!item) return null;

            return (

              <div
                className="
                  w-80
                  rounded-xl
                  border
                  bg-white
                  shadow-2xl
                  p-4
                "
              >

                <div className="font-bold text-[#7A1F2B] mb-2">

                  {getLetter(item.id)}

                </div>

                <HtmlContent
                  html={item.text}
                />

              </div>

            );

          })()

        ) : null}

      </DragOverlay>

    </DndContext>

  );

}