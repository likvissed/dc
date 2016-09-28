class CreateServerParts < ActiveRecord::Migration
  def change
    create_table :server_parts do |t|
      t.string  :name, index: true
      t.string  :part_num
      t.text    :comment
      t.references :detail_type
      t.timestamps null: false
    end
  end
end
