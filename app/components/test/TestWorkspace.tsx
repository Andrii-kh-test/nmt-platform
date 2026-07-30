"use client";

import TestHeader from "./TestHeader";
import QuestionView from "./QuestionView";
import Sidebar from "./Sidebar";

export default function TestWorkspace() {
  return (
    <>
      <TestHeader />

      <div className="max-w-7xl mx-auto py-8 px-6">
        <div className="grid grid-cols-12 gap-8">

          <div className="col-span-8">
            <QuestionView />
          </div>

          <div className="col-span-4">
            <Sidebar />
          </div>

        </div>
      </div>
    </>
  );
}