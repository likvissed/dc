class AddAttachmentsToServices < ActiveRecord::Migration
  def up
    change_table :services do |t|
      t.attachment :scan, after: :additional_data
      t.attachment :act, after: :scan_file_name
      t.attachment :instr_rec, after: :has_instr_rec
      t.attachment :instr_off, after: :has_instr_off
    end
  end

  def down
    remove_attachment :services, :scan
    remove_attachment :services, :act
    remove_attachment :services, :instr_rec
    remove_attachment :services, :instr_off
  end
end
